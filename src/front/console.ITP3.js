//@flow

// An REPL for ITP3, a general interpretation for all platform
// An abstraction about interaction
// where includes information about Instructions, Targeted-Tactic, Tactic, 
// which can be then translated into (PartialGoals => Commands) 

import type {ID, Generator, Dict, Option} from "../globalDef"
import {debug, ideq, ppID, concat, concat_, joinGen, mapGen, toArrayFillBlankWith, endswith, listGen, obeq} from "../globalDef"
import type {pttm} from "../ITP2" 
import {pprintDict, ppPttm, _add_to_dict,_find_in_dict} from "../ITP2"
import type {DefinitionList, Commands, Command, NewJudgement, Goal, Goals, PartialGoals, Context} from "../ITP.pver"
import {pfconstructor,newtermChecker,pfChecker, ppCmd, ppCtx, ppDefL, defListToCtx} from "../ITP.pver"


type Actic = PartialGoals => Commands;




type TContext = Dict<ID, Tactic>;

// MEDIUM LEVEL : META TACTIC
// A Tactic is a instruction that can be interpreted into (A function from PartialGoals to Commands := Actic)

type Tactic = 
    {type : "cmds", t : Command} // apply same command to all of the current subgoal
    | {type : "seq", t0 : Tactic, t1 : Tactic}
    | {type : "let", name : ID, bind : Tactic, body : Tactic}
    | {type : "metavar", n : ID}

// A group of targeted tactic
// number denote the goal number targeted
type TTactic = Dict<number, Tactic>;


// TContext -> String
const pprintTac = (x : Tactic) : string => {
    if(x.type === "cmds") {
        return ppCmd(x.t);
    } else if(x.type === "seq") {
        return pprintTac(x.t0) + ";" + pprintTac(x.t1);
    } else if(x.type === "let") {
        return "let " + ppID(x.name) + " = " + pprintTac(x.bind) + " in " + pprintTac(x.body);
    } else if(x.type === "metavar") {
        return ppID(x.n);
    } 
    return "";
}


const donothing : Generator<Actic> = listGen([s => Array(s.length).fill({type : "idtac"})])
// The interpreter of A single tactic
// tactic has a property that it is not going to be exposed to the current goal number
// so a single tactic will do things to all the possible goals
// and only TTactic -- targeted tactic know things about goal number
const tacticIntp = (tctx : TContext, tac_ : Tactic) : Generator<Actic> => {
    const tac = tac_;
    if(tac.type === "cmds"){
        return listGen([s => Array(s.length).fill(tac.t)]);
    } else if(tac.type === "seq") {
        const tip = t => tacticIntp(tctx, t);
        return concat_(tip(tac.t0), () => tip(tac.t1));
    } else if(tac.type === "let") {
        return tacticIntp(_add_to_dict(tac.name, tac.bind, tctx), tac.body);
    } else if(tac.type === "metavar") {
        const subs = _find_in_dict(x => ideq(x, tac.n), tctx);
        if(subs === undefined) {
            return donothing;
        }
        return tacticIntp(tctx, subs);
    } else {
        return donothing;
    } 
};


// starting from here, code is elegant (I think) but ambiguous
// the reason is due to Generator<> is a function with side-effect

// join is actually a flip makes (() => PG => CMDs ) -> (PG => () => CMDs), where the second 
// parenthesis can be auto applied when PG is applied, makes it into (PG => CMDs)
const __joinActic_endwithdefocus : (Generator<Actic> => Actic) = gen => {
            const infGen = endswith(x => Array(x.length).fill({type : "defocus"}), gen); 
            return pgs => infGen()(pgs);
        }

// translate TTactic into Actic
// actually, Tactic class is much easier to be translated
// The reason TTactic can be translated is largely due to the "focus" command
const ttacticIntp = (tctx : TContext, ttac_ : TTactic) : Generator<Actic> => {
    const ttac = ttac_;
    const idtac : Command = ({type : "idtac"});
    const dictofGen : Dict<number, Generator<Actic>> = ttac.map(x => [x[0], tacticIntp(tctx, x[1])]);

    const arrayOfFocus : Dict<number, Command> = dictofGen.map(x => [x[0], __joinActic_endwithdefocus(x[1])])
                                                          .map(x => [x[0],{type : "focus", streamOfCmd : x[1]}])
    
    return listGen([pgs => toArrayFillBlankWith(arrayOfFocus, pgs.length, idtac)]);
}

const prettyprintTacCtx = pprintDict((x:ID) => x.toString(), pprintTac);





type stdIO = {i : Input<TTactic>, iI : Input<INSTRUCTION>, o : Output, e : Error, scripts : () => string};

type Input<K> = string => K;
type Output = string => string;
type Error = string => typeof undefined;

const inputAsGen = (i : Input<TTactic>) : Generator<TTactic> => (x => i(""));

const ppPGs = (pg : PartialGoals) : string => 
    pg.map((x,index) => {
                if(typeof x !== 'boolean'){
                    return index.toString() + "] " + ppCtx(x[0]) + "\n ?- " + ppPttm(x[1]);
                } 
                return "";})
        .filter(x => x !== "")
        .join("\n");



// the flatmap (joinGen) makes input into a generator of actic
// because each tactic can deal with several times of interaction (a number of Commands)
// we need to flatmap, and what's more, the envoke of input becomes implicit
const interaction = (ioe : stdIO, tctx : TContext) : (PartialGoals => Commands) => {
    const tacticInput : Generator<Actic> = joinGen(mapGen(y => ttacticIntp(tctx, y), inputAsGen(ioe.i)));
    return s => {
        ioe.o(ppPGs(s));
        let tI = tacticInput();
        while(tI === undefined){
            tI = tacticInput();
        }
        return tI(s);
    }
}
const PFCONSOLE = (ioe : stdIO, tctx : TContext, dctx : DefinitionList, newty : pttm) : pttm => {
    // here it's too stupid
    // const ctx : Context = dctx.map(x => [x[0], [(x[1][0] : pttm | "bottom" | false), x[1][1]]]);
    const ctx : Context = defListToCtx(dctx);
    debug("function PFCONSOLE, with pfconstructor, proof mode.")
    const term = pfconstructor(interaction(ioe, tctx), ioe.e, [[ctx, newty]])[0];
    debug("function PFCONSOLE return, back to normal mode.")
    return term;
}


// UPPER LEVEL : CONSOLE
// by addDef, we can enter proof mode(pf constructor)

type INSTRUCTION = 
    {type : "addDef", name : ID, ty : pttm}
    | {type : "addAxiom", name : ID, ty : pttm}
    | {type : "addTactic", name : ID, tac : Tactic}
    | {type : "printScript"}
    | {type : "printDef"}
    | {type : "printTacs"}
    | {type : "terminate"}


const defaultprintDef = (o : string => typeof undefined) : (DefinitionList => typeof undefined) => (x => o(ppDefL(x)));
const defaultprintScript = (o : string => typeof undefined) : (string => typeof undefined) => (s => o(s));

const CONSOLE = (ioe : stdIO) : typeof undefined => {
    let AllDefinitions : DefinitionList = [];
    let AllTactics : TContext = [];
    
    while(true){
        
        const input : INSTRUCTION = ioe.iI("");
        
        // debug(input + " function CONSOLE");
        if(input.type === "terminate"){
            break;
        } else if(input.type === "addDef") {
            // Into Proof Mode
            ioe.o("Enter Proof Mode.");
            const tm = PFCONSOLE(ioe, AllTactics, AllDefinitions, input.ty);
            ioe.o("Back to Instruction Mode.");
            if(!newtermChecker(AllDefinitions, input.name, tm, input.ty)) {ioe.e("Define Failed."); continue;}
            AllDefinitions.push([input.name, [tm, input.ty]]);
        } else if(input.type === "addAxiom"){
            const tm = "bottom";
            if(!newtermChecker(AllDefinitions, input.name, tm, input.ty)) {ioe.e("Define Failed."); continue;}
            AllDefinitions.push([input.name, [tm, input.ty]]);
        } else if(input.type === "addTactic") {
            AllTactics.push([input.name, input.tac]);
        } else if(input.type === "printScript") {
            ioe.o(ioe.scripts());
        } else if(input.type === "printDef") {
            if(!pfChecker(AllDefinitions)) {ioe.e("Unexpected Internal Error. Cannot output definition."); continue;}
            ioe.o(ppDefL(AllDefinitions));
        } else if(input.type === "printTacs"){
            ioe.o(prettyprintTacCtx(AllTactics));
        } 
    }

    return undefined;
}


module.exports = {
    CONSOLE,
    defaultprintDef,
    defaultprintScript
};

// Intended to make it monadic form
// I think if I did that, I would be an idiot.

//
// class StateTransition<S, R>{
//     constructor(t : S => [S, R]) {
//         this.transition = t;
//     }
//     <Q>bind(f : R => StateTransition<S, Q>) : State<S,Q> {
//         return new StateTransition(
//             s => {
//                 const intermediate = this.transition(s);
//                 const iS = intermediate[0];
//                 const iR = intermediate[1];
//                 return f(iR).transition(iS);
//             }
//         );
//     }
//     <Q>ttach(f : StateTransition<S, Q>) : StateTransition<S, Q> {
//         return new StateTransition(
//             s => {
//                 const intermediate = this.transition(s);
//                 const iS = intermediate[0];
//                 const iR = intermediate[1];
//                 return f.transition(iS);
//             }
//         )
//     }
    
// }
// const idret<S, R> = (t : R) : StateTransition<S, R> => 
//     new StateTransition<S, R>(s => [s, t]) 
// const get<S> = new StateTransition<S, S>(s => [s, s]);
// const modify= <S, typeof undefined> (t : S => S) : StateTransition<S, R> =>
//          new StateTransition(s => [t(s), undefined];
// type BACKG = {iT : Input<Tactic>, o : Output<String>, e : Error, defs : DefinitionList, definedTactis : Array<number, >};

// const PFCONSOLE = (newname : number, newty : pttm) : StateTransition<BACKG, Array<pttm>> => {
//     get.bind( backg => {
//         const interaction = (pg : PartialGoals) : Commands =>
//             backg.o(prettyprint(pg)), backg.iC("");
//         return idret(pfconstructor())
//     }
// )
// }