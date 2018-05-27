//@flow

// An REPL for ITP3, a general interpretation for all platform

import type {pttm, Dict, Option} from "./ITP2" 
import type {DefinitionList, Commands, Command, NewJudgement, Goal, Goals, PartialGoals, Context} from "./ITP.pver"
import {pfconstructor,newtermChecker,pfChecker} from "./ITP.pver"

let AllDefinitions : DefinitionList = [];

type Actic = PartialGoals => Commands;
type Generator<X> = () => Option<X> ;
type TContext = Dict<number, Tactic>;

type Tactic = 
    {type : "cmd", t : Commands}
    | {type : "seq", t0 : Tactic, t1 : Tactic}
    | {type : "let", name : number, bind : Tactic, body : Tactic}
    | {type : "abs", name : number, body : Tactic}
    | {type : "call", }

const concat = <X>(f : Generator<X>, g : Generator<X>):Generator<X> => 
                        {
                            let flag:boolean = true;
                            return x => {
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
                        }
const joinGen = <X>(f : Generator<Generator<X>>) : Generator<X> 
const tacticIntp = (tctx : TContext, tac : Tactic) : Generator<Actic> => {
    if(tac.type === "seq"){
        return concat()
    }
}

type stdIO = {i : Input, o : Output, e : Error};

type Input = string => Tactic;
type Output = string => string;
type Error = string => typeof undefined;

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

const prettyprint = (pg : PartialGoals) : string => 
const PFCONSOLE = (ioe : stdIO, tctx : TContext, name: number, newterm : pttm) =>  