//@flow

// An REPL for ITP3, a general interpretation for all platform

import type {ID} from "./globalDef"
import {ppID, ideq} from "./globalDef"
import type {pttm, Dict, Option} from "./ITP2" 
import {pprintDict, ppPttm, _add_to_dict,_find_in_dict} from "./ITP2"
import type {DefinitionList, Commands, Command, NewJudgement, Goal, Goals, PartialGoals, Context} from "./ITP.pver"
import {pfconstructor,newtermChecker,pfChecker, ppCmd, ppCtx} from "./ITP.pver"



type Actic = PartialGoals => Commands;

type TContext = Dict<ID, Tactic>;

// Generator -- a lazy (potential) infinite list
type Generator<X> = () => Option<X> ;

// Array -> Generator
const listGen= <X>(l : Array<X>) : Generator<X> => {
    let index = 0;
    return () => {
        index = index + 1;
        return l[index];
    }
}

// MEDIUM LEVEL : META TACTIC
// A Tactic is a instruction that can be interpreted into (A function from PartialGoals to Commands := Actic)

type Tactic = 
    {type : "cmds", t : Commands}
    | {type : "seq", t0 : Tactic, t1 : Tactic}
    | {type : "let", name : ID, bind : Tactic, body : Tactic}
    | {type : "metavar", n : ID}

// TContext -> String
const pprintTac = (x : Tactic) : string => {
    if(x.type === "cmds") {
        return x.t.map(ppCmd).join('|');
    } else if(x.type === "seq") {
        return pprintTac(x.t0) + ";" + pprintTac(x.t1);
    } else if(x.type === "let") {
        return "let " + ppID(x.name) + " = " + pprintTac(x.bind) + " in " + pprintTac(x.body);
    } else if(x.type === "metavar") {
        return ppID(x.n);
    } 
    return "";
}


const donothing : Generator<Actic> = listGen([s => [{type: "idtac"}]])
// The interpreter of Tactic
const tacticIntp = (tctx : TContext, tac_ : Tactic) : Generator<Actic> => {
    const tac = tac_;
    if(tac.type === "cmds"){
        return listGen([s => tac.t]);
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

const prettyprintTacCtx = pprintDict((x:ID) => x.toString(), pprintTac);



const concat = <X>(f : Generator<X>, g : Generator<X>):Generator<X> => {
                            let flag = true;
                            return () => {
                                if(flag){
                                    const r = f();
                                    if(r !== undefined) {
                                        return r;
                                    } else {
                                        flag = false;
                                    }
                                }
                                return g(); 
                                };
                        };

const concat_ =<X>(f : Generator<X>, g : () => Generator<X>):Generator<X> => {
                            let flag = true;
                            let g_ : typeof undefined | Generator<X> = undefined;
                            return () => {
                                if(flag){
                                    const r = f();
                                    if(r !== undefined) {
                                        return r;
                                    } else {
                                        flag = false;
                                        g_ = g();
                                    }
                                }
                                if(g_ === undefined) {
                                    return undefined;
                                } else {
                                    return g_();
                                }
                                };
                        };
const joinGen = <X>(f : Generator<Generator<X>>) : Generator<X> => {
    let current = f();
    return () => {
        if(current === undefined) {
            return undefined;
        }
        const r = current();
        if(r === undefined) {
            current = f();
            if(current === undefined) {
            return undefined;
            }
        } else {
            return r;
        }
    };
};

const mapOption = <X, Y> (fmap : X => Y):(Option<X> => Option<Y>) => x => {
    if(x === undefined) {return undefined;} else {return fmap(x);}
}
const mapGen = <X, Y>(fmap : X => Y, gen : Generator<X>) : Generator<Y> => (() => mapOption(fmap)(gen()));



type stdIO = {i : Input<Tactic>, iI : Input<INSTRUCTION>, o : Output, e : Error};

type Input<K> = string => K;
type Output = string => string;
type Error = string => typeof undefined;

const inputAsGen = (i : Input<Tactic>) : Generator<Tactic> => (x => i(""));

const ppPGs = (pg : PartialGoals) : string => 
    pg.map((x,index) => {
                if(typeof x !== 'boolean'){
                    return index.toString() + "] " + ppCtx(x[0]) + " |- " + ppPttm(x[1]);
                } 
                return "";})
        .filter(x => x !== "")
        .join("\n");



// the flatmap (joinGen) makes input into a generator of actic
// because each tactic can deal with several times of interaction (a number of Commands)
// we need to flatmap, and what's more, the envoke of input becomes implicit
const interaction = (ioe : stdIO, tctx : TContext) : (PartialGoals => Commands) => {
    const tacticInput : Generator<Actic> = joinGen(mapGen(y => tacticIntp(tctx, y), inputAsGen(ioe.i)));
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
    const ctx : Context = dctx.map(x => [x[0], [(x[1][0] : pttm | "bottom" | false), x[1][1]]]);
    return pfconstructor(interaction(ioe, tctx), ioe.e, [[ctx, newty]])[0];
}


// UPPER LEVEL : CONSOLE
// by addDef, we can enter proof mode(pf constructor)

type INSTRUCTION = 
    {type : "addDef", name : ID, ty : pttm}
    | {type : "addTactic", name : ID, tac : Tactic}
    | {type : "printScript", outMethod : string => typeof undefined}
    | {type : "printDef", outMethod : DefinitionList => typeof undefined}
    | {type : "printTacs"}
    | {type : "terminate"}

const CONSOLE = (ioe : stdIO) : typeof undefined => {
    let AllDefinitions : DefinitionList = [];
    let AllTactics : TContext = [];
    let ProofScript : string = "";
    while(true){
        const input : INSTRUCTION = ioe.iI("");
        if(input.type === "terminate"){
            break;
        } else if(input.type === "addDef") {
            // Into Proof Mode
            const tm = PFCONSOLE(ioe, AllTactics, AllDefinitions, input.ty);
            if(!newtermChecker(AllDefinitions, input.name, tm, input.ty)) {ioe.e("Define Failed."); continue;}
            AllDefinitions.push([input.name, [tm, input.ty]]);
        } else if(input.type === "addTactic") {
            AllTactics.push([input.name, input.tac]);
        } else if(input.type === "printScript") {
            input.outMethod(ProofScript);
        } else if(input.type === "printDef") {
            if(!pfChecker(AllDefinitions)) {ioe.e("Unexpected Internal Error. Cannot output definition."); continue;}
            input.outMethod(AllDefinitions);
        } else if(input.type === "printTacs"){
            ioe.o(prettyprintTacCtx(AllTactics));
        } 
    }

    return undefined;
}


function input_console(pg : PartialGoals):Commands{
    
}



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