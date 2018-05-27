//@flow

// An REPL for ITP3, a general interpretation for all platform

import type {pttm, Dict, Option} from "./ITP2" 
import type {DefinitionList, Commands, Command, NewJudgement, Goal, Goals, PartialGoals, Context} from "./ITP.pver"
import {pfconstructor,newtermChecker,pfChecker} from "./ITP.pver"



type Actic = PartialGoals => Commands;
type Generator<X> = () => Option<X> ;
type TContext = Dict<number, Tactic>;

// MEDIUM LEVEL : META TACTIC
// A Tactic is a instruction that can be interpreted into (A function from PartialGoals to Commands := Actic)

type Tactic = 
    {type : "cmds", t : Commands}
    | {type : "seq", t0 : Tactic, t1 : Tactic}
    | {type : "let", name : number, bind : Tactic, body : Tactic}
    | {type : "abs", name : number, body : Tactic}
    | {type : "call"}

// TContext -> String
const prettyprintTac = (tctx : TContext) : string => {

}

// Array -> Generator
const listGen= <X>(l : Array<X>) : Generator<X> => {
    let index = 0;
    return () => {
        index = index + 1;
        return l[index];
    }
}

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

const mapGen = <X, Y>(fmap : X => Y, gen : Generator<X>) : Generator<Y> => (() => fmap(gen()));

// The interpreter of Tactic
const tacticIntp = (tctx : TContext, tac : Tactic) : Generator<Actic> => {
    if(tac.type === "cmds"){
        return listGen([s => tac.t]);
    } else if(tac.type === "seq") {
        const tip = t => tacticIntp(tctx, t);
        return concat(tip(tac.t0), tip(tac.t1));
    } else if(tac.type === "let") {
        
        return tacticIntp(_add_in_dict(tac.name, tac.bind, tctx), )
    }
};

type stdIO = {i : Input<Tactic>, iI : Input<INSTRUCTION>, o : Output, e : Error};

type Input<K> = string => K;
type Output = string => string;
type Error = string => typeof undefined;

const inputAsGen = (i : Input) : Generator<Tactic> => (x => i(""));

const prettyprint = (pg : PartialGoals) : string => 



const interaction = (ioe : stdIO, tctx : TContext) : PartialGoals => Commands => {
    const tacticInput : Generator<Actic> = joinGen(mapGen(y => tacticIntp(tctx, y), inputAsGen(ioe.i)));
    return s => {
        ioe.o(s);
        return tacticInput();
    }
}
const PFCONSOLE = (ioe : stdIO, tctx : TContext, dctx : DefinitionList, newty : pttm) : pttm => 
    pfconstructor(interaction(ioe, tctx), ioe.e, [[dctx, newty]]);

// UPPER LEVEL : CONSOLE

type INSTRUCTION = 
    {type : "addDef", name : number, ty : pttm}
    | {type : "addTactic", name : number, tac : Tactic}
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
            AllDefinitions.push([input.name, tm]);
        } else if(input.type === "addTactics") {
            AllTactics.push([input.name, input.tac]);
        } else if(input.type === "printScript") {
            input.outMethod(ProofScript);
        } else if(input.type === "printDef") {
            if(!pfChecker(AllDefinitions)) {ioe.e("Unexpected Internal Error. Cannot output definition."); continue;}
            input.outMethod(AllDefinitions);
        } else if(input.type === "printTacs"){
            ioe.o(prettyprintTac(AllTactics));
        } 
    }

    return undefined;
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