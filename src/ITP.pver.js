//@flow

// A prover : Extend Coc with definition, become lambdaD
// should named as ITP3.js

import type {pttm} from "./ITP2" 
import {ideq, ppID} from './globalDef'
import type {ID, Dict, Option, IO, GR} from "./globalDef"
import {
    untyped_beta_conversion,
    has_type,
    TYPE_STAR,
    TYPE_SQUARE,
    obeq,
    _add_to_dict,
    _find_in_dict,
    _reverse_mapping,
    pprintDict,
    ppPttm
} from "./ITP2"
//const ITP2 = require("./ITP2");
//const has_type = ITP2.has_type;
const untyped_beta_conv = untyped_beta_conversion;
//const TYPE_STAR = ITP2.TYPE_STAR;
//const TYPE_SQUARE = ITP2.TYPE_SQUARE;

// proof constructor : Command -> pttm
// proof constructor only works at type-level
//type Dict<K, V> = Array<[K, V]>;
//type Option<T> = T | typeof undefined;
//
//const obeq = (a: Object, b:Object):boolean => (typeof a === typeof b) && (JSON.stringify(a) === JSON.stringify(b));

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

//const _add_to_dict = <K, V>(newterm : K, newtype : V, ctx: Dict<K,V>) : Dict<K,V> => {let r = ctx.slice(); r.push([newterm, newtype]); return r;}
//const _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : Option<V> => 
//        (x_ => {const x = x_[x_.length - 1]; if(!x){return x[1];}else{return undefined;}})(ctx.filter(x => pred(x[0])));
//const _reverse_mapping = <K, V>(d : Dict<K,V>) : Dict<V,K> => d.map(x => [x[1], x[0]]);

export type ValOfCtx = [pttm | "bottom" | false, pttm]; // definee & its type, if its definee is bottom, its primitive definition; if it is false, then it is in context

export type Context = Dict<ID, ValOfCtx>;
const addCtx = _add_to_dict;
const findinCtx = (ctx: Context, n:ID) => _find_in_dict(j => ideq(n, j), ctx);
const ppCtx = pprintDict(ppID, x => {
        let ret = "";
        if(typeof (x[0]) === 'object'){
            ret = ret + " := " + ppPttm(x[0]);
        }
        return ret + " : " + ppPttm(x[1]);
        });

//type DefContext = Dict<ID, [pttm, pttm]>;
//type GlobalContext = Context;
type Judgement = [Context, pttm];
export type Goal = [Context, pttm];
export type Goals = Array<Goal>
export type PartialGoals = Array<Goal | true>
type NewContext = Context;
export type NewJudgement = pttm;
export type Commands = Array<Command>;
type ArrayF<Domain, Codomain> = [number, Array<Domain> => Array<Codomain>]; // tuple of  [size of doman of the function, function]
export type DefinitionList = Dict<ID, [pttm | "bottom", pttm]>;
const ppDefL : DefinitionList => string = pprintDict(ppID, x => " := " + ppPttm(x[0]) + " : " + ppPttm(x[1]));

// homomorphism
// make two arrayF into one by expanding domain and codomain
const connect = <D,C>(f : ArrayF<D,C>, g: ArrayF<D,C>) : ArrayF<D,C> => {
    const f_ = (a : Array<D>) : Array<C> => f[1](a.slice(0, f[0]));
    const g_ = (a : Array<D>) : Array<C> => g[1](a.slice(f[0], f[0] + g[0]));
    return [f[0] + g[0], a => f_(a).concat(g_(a))];
}

// Now it's all about proof constructor
// Proof constructor is a transformation from an array of commands to term in Coc

export type Command =
    {type : "intro"}
    | {type : "apply", caller : NewJudgement, callee : NewJudgement}
    | {type : "check", term : pttm}
    | {type : "conv", newform : NewJudgement} // type level calculation
    | {type : "let", bind: ID, term : pttm} // local definition
    | {type : "idtac"}
    | {type : "focus", streamOfCmd : PartialGoals =>IO<Commands>} // not open
    | {type : "defocus"} // not open

    
const ppCmd = (x : Command) : string => JSON.stringify(x)

// flatmap the (parital goals, arrayF) array into one tuple
// like a 'join' in the monad
const combine = (gs : Array<[PartialGoals, ArrayF<pttm, pttm>]>) : [PartialGoals, ArrayF<pttm, pttm>] => {
    return gs.reduce((x,y) => [x[0].concat(y[0]), connect(x[1], y[1])]);
}
// At ITP2, it's pure Coc, so we have to reduce lambdaD into lambdaC
const untyped_delta_conv_all = (ctx : Context, tm : pttm) : pttm => {
    const utca = x => untyped_delta_conv_all(ctx, x);
    if(tm.type === "lambda") {
        return {type : "lambda", bind : tm.bind, iT : tm.iT, body : utca(tm.body)};
    } else if(tm.type === "pi") {
        return {type : "pi", bind : tm.bind, iT : tm.iT, body : utca(tm.body)};
    } else if(tm.type === "apply") {
        return {type : "apply", fun : utca(tm.fun), arg : utca(tm.arg)};
    } else if(tm.type === "var") {
        const replacement0_ : Option<ValOfCtx> = (findinCtx(ctx, tm.n));
        if(replacement0_ === undefined) {return tm;}
        const replacement0 : ValOfCtx = replacement0_;
        if(replacement0[0] === "bottom") {
            return tm;
        } else if(replacement0[0] === false) {
            return tm;
        } else {
            return utca(replacement0[0]);
        }
    } else {
        return tm;
    }
}

const untyped_beta_delta_conv_all = (ctx : Context, tm : pttm) : pttm => untyped_beta_conv(untyped_delta_conv_all(ctx, tm));

// Yes. casting. I hate it. But flow is too silly.
const defListToCtx = (defl : DefinitionList) : Context => ((defl: any) : Context)

// prerequisite : ctx is consistent
const newtermChecker = (ctx : DefinitionList, newbind: ID, newterm : pttm | "bottom", decType : pttm) : boolean => {
    const type_ctx = ctx.map(x => [x[0], x[1][1]]);
    const tyOfdecType = has_type(type_ctx, untyped_delta_conv_all(defListToCtx(ctx), decType));
    if((!obeq(tyOfdecType, TYPE_SQUARE)) && (!obeq(tyOfdecType, TYPE_STAR)) && (!obeq(decType, TYPE_SQUARE))) {return false;}
    if(newterm === "bottom") {return true;}
    if(_find_in_dict(x => x === newbind, ctx) !== undefined) {return false;}
    if(!obeq(has_type(type_ctx, newterm),decType)) {return false;}
    return true;
}

// Check the whole proof is correct
const pfChecker = (ctx : DefinitionList) : boolean => {
    if(ctx.length == 0) {
        return true;
    }
    const oldlist = ctx.slice(0, ctx.length - 1);
    return pfChecker(oldlist) && 
            newtermChecker(oldlist, ctx[ctx.length-1][0], ctx[ctx.length-1][1][0], ctx[ctx.length-1][1][1]);
}


//////////// Core of the Interactive Thm Prover, a helper to construct a proof

// for a specific partial goal, it may transform into several newly-needed subgoals, then we have to flatmap them
// each array of commands is like a matrix transformation, then transform an array of partial goal into a new array of newly-needed  partial goal
// the reason why it is partial goal is because the goal may have been accomplished
// return a newly-needed array of goals (Partial Goals) and the achieved construction method (ArrayF<..,..>) 
// and if those construction method is applied on the terms(construction) of newly added goal, we can get the term of the original goals
//    so after one call, all we need is the construction of newly-needed goals
// If a goal is constructed, then the corresponding place in that array is true; and the corresponding place in ArrayF would be a constant function return the construction)
const goaltransform = 
    function* (ncmd : (PartialGoals) => IO<Commands>,warn: string => typeof undefined, cmd_ : Command, goal_ : Goal | true) : GR<[PartialGoals, ArrayF<pttm, pttm>]> {
    const cmd = cmd_;
    const donothing : ArrayF<pttm, pttm> = [1, x => x];
    if(goal_ === true) {
        return [[true], donothing];
    }
    const goal : Goal = goal_;
    // Now goal is not true
    const ctx : Context = goal[0];
    const ctx_list = ctx.map(x => [x[0], x[1][1]]);
    let goal_ty = goal[1];
    if(cmd.type === "intro") {
        // check truely a function
        if(goal_ty.type !== "pi") {warn("Intro failed."); return [[goal], donothing];}
        return [[[addCtx(goal_ty.bind, [false, goal_ty.iT], ctx), goal_ty.body]],
                [1, x => [{type : "lambda", bind : goal_ty.bind, iT : goal_ty.iT, body : x[0]}] ]];
    } else if (cmd.type === "apply") {
        // a command to construct a term by application of a function with proper arguments
        const claimed_fty = cmd.caller;
        const claimed_xty = cmd.callee;
        
        const type_of_claimed_f = has_type(ctx_list, claimed_fty);
        const type_of_claimed_x = has_type(ctx_list, claimed_xty);
        if(type_of_claimed_f === undefined || !obeq(type_of_claimed_f, TYPE_STAR) 
            || type_of_claimed_x === undefined || !obeq(type_of_claimed_f, TYPE_STAR)) {warn("Apply failed. Type Inconsistent."); return [[goal], donothing];}
        if(claimed_fty.type !== "pi") {warn("Apply failed. Type Inconsistent."); return [[goal], donothing];}
        if(!obeq(claimed_fty.iT, claimed_xty)) {warn("Apply failed. Type Inconsistent."); return [[goal], donothing];}
        return [
                [[ctx, claimed_fty],
                 [ctx, claimed_xty]] , //: PartialGoals,
                 [2,x => [{type: "apply", fun : x[0], arg: x[1]}]]
                ];
    } else if (cmd.type === "check") {
        // directly give out the term
        const claimed_term = cmd.term;
        const claimed_term_ty = has_type(ctx_list, claimed_term);
        if(!obeq(claimed_term_ty,goal_ty)) {warn("Check failed. Type Inconsistent."); return [[goal], donothing];}
        return [[true], [1, x => [claimed_term]]];
    } else if (cmd.type === "conv") {
        // type equivalence -- same type
        const claimed_ty = cmd.newform;
        // now beta, delta conversion
        const ty_claimed_ty = has_type(ctx_list, claimed_ty);
        if(ty_claimed_ty === undefined) {warn("Conversion failed. Types are not equivalent."); return [[goal], donothing];}
        if(!obeq(untyped_beta_delta_conv_all(ctx, claimed_ty), untyped_beta_delta_conv_all(ctx, goal_ty))) {warn("Conversion failed. Types are not equivalent."); return [[goal], donothing];}
        return [[[ctx, claimed_ty]], [1, x => x]];
        
    } else if (cmd.type === "let") {
        // give a term a name
        const new_add_term = cmd.term;
        const new_add_term_ty = has_type(ctx_list, new_add_term);
        if(new_add_term_ty === undefined) {warn("Local Define failed. Unsupported type"); return [[goal], donothing];}
         return [[[addCtx(cmd.bind, [new_add_term, new_add_term_ty], ctx), goal_ty]],
                [1, x => [  {type: "apply",
                            fun : {type : "lambda", bind : cmd.bind, iT : new_add_term_ty, body : x[0]},
                            arg : new_add_term
                        }
                        ]] ];
    } else if(cmd.type === "focus") {
        // most special, it will hang up the current goal and star focusing on one particular partial goal
        // and use the streamOfCmd on it, and every streamOfCmd would always have 'defocus' at the end, which makes focus stop
        // const term = pfconstructor(ncmd, warn, [goal])[0];
        // return [[true], [1, x => [term]]];
        const ret_ = yield* ppfconstructor(cmd.streamOfCmd, warn, [goal]);
        return ret_;
    } else if(cmd.type === "idtac") { 
        return [[goal], donothing];
    } else {
        warn("Something Unexpected Happened.");
        return [[goal], donothing];
    }

}





// Core of this file, transform an array of partial goal into an array of term each with correct type
// term finder in some sense
// the core of lambdaD, though no correctness is assure and necessary -- all the correctness is based on ITP2 (Coc)
const pfconstructor = 
    function* (ncmd : (PartialGoals) => IO<Commands>, warn: string => typeof undefined, currentGoals : PartialGoals) : GR<Array<pttm>> {
    let nextcmds_ = yield* ncmd(currentGoals)();
    while(nextcmds_.length !== currentGoals.length) {
        warn("Error: Command number not enough");
        nextcmds_ = yield* ncmd(currentGoals)();
    }
    const nextcmds : Commands = nextcmds_;
    // construct things for each goal
    const newGoals_IT_ : Array<GR<[PartialGoals, ArrayF<pttm, pttm>]>> = 
        nextcmds.map((cmd, index) => goaltransform(ncmd, warn, cmd, currentGoals[index]));
    let newGoals_IT__ : Array<[PartialGoals, ArrayF<pttm, pttm>]> = [];
    // open the IO<..> decorator
    for(let each_new_goal of newGoals_IT_) {
        const adding : [PartialGoals, ArrayF<pttm, pttm>] = yield* each_new_goal;
        newGoals_IT__.push(adding);
    }
    // each construction is a tuple of an array of newly needed goals and a adjoint transformation function(ArrayF)
    // combine those arrays and functions
    const newGoals_IT = combine(newGoals_IT__);
                       
    const newGoals : PartialGoals = newGoals_IT[0];
    // checking adjoint transformation is proper
    if(newGoals_IT[1][0] !== newGoals.length) {warn("Internal Error: Domain number incoincides with array element number");}
    // inverseTranform is exactly transformation, because it transform newly added into original, thus an 'inverse'
    const inverseTransform : Array<pttm> => Array<pttm> = newGoals_IT[1][1];
    if(newGoals.filter(x => x !== true).length === 0) {
        // All constructed, call the constant function to get all the current terms of the inputting goal
        return inverseTransform(newGoals.map(x => ((undefined : any): pttm)));
    } else {
        // Some are not constructed, a recursive call to get all the constructed items on the newly needed goals
        // And use the adjoint function to transform the newly needed goals into originally needed goals
        const ret_ : Array<pttm> = yield* pfconstructor(ncmd, warn, newGoals);
        return inverseTransform(ret_);
    }
}


// more generalized now
// partial proof constructor
// will stop constructing when meet defocus
// always return the term constructed with all effort
// maybe replace pfconstructor because pfconstructor cannot terminate the process as the user want, unless they complete the construction
const ppfconstructor = 
    function* (ncmd : (PartialGoals) => IO<Commands>, warn: string => typeof undefined, currentGoals : PartialGoals) : GR<[PartialGoals, ArrayF<pttm, pttm>]> {
    let nextcmds_ = yield* (ncmd(currentGoals)());
    if(nextcmds_[0].type === "defocus") {
        // the way to stop
        return [currentGoals, [currentGoals.length, x => x]];
    }
    while(nextcmds_.length !== currentGoals.length) {
        warn("Error: Command number not enough");
        nextcmds_ = yield* (ncmd(currentGoals)());
    }
    const nextcmds : Commands = nextcmds_;
    // construct things for each goal
    const newGoals_IT_ : Array<GR<[PartialGoals, ArrayF<pttm, pttm>]>> = 
        nextcmds.map((cmd, index) => goaltransform(ncmd, warn, cmd, currentGoals[index]));
    let newGoals_IT__ : Array<[PartialGoals, ArrayF<pttm, pttm>]> = [];
    // open the IO<..> decorator
    for(let each_new_goal of newGoals_IT_) {
        const adding : [PartialGoals, ArrayF<pttm, pttm>] = yield* each_new_goal;
        newGoals_IT__.push(adding);
    }
    // each construction is a tuple of an array of newly needed goals and a adjoint transformation function(ArrayF)
    // combine those arrays and functions
    const newGoals_IT = combine(newGoals_IT__);

    const newGoals : PartialGoals = newGoals_IT[0];
    if(newGoals_IT[1][0] !== newGoals.length) {warn("Internal Error: Domain number incoincides with array element number");}
    if(newGoals.filter(x => x !== true).length === 0) {
        // All constructed.. no need to go on the construction
        // relieve the streamOfCmd and give back the construction
        return newGoals_IT;
    }
    // Some are not constructed, a recursive call to get all the constructed items on the newly needed goals
    // And use the adjoint function to transform the newly needed goals into originally needed goals
    const retGoals_IT = yield* ppfconstructor(ncmd, warn, newGoals);
    return [retGoals_IT[0], [retGoals_IT[1][0], x => newGoals_IT[1][1](retGoals_IT[1][1](x))]];
    // if(newGoals_IT[1][0] !== newGoals.length) {warn("Internal Error: Domain number incoincides with array element number");}
    // const inverseTransform : Array<pttm> => Array<pttm> = newGoals_IT[1][1];
    // if(newGoals.filter(x => x !== true).length === 0) {
    //     return inverseTransform(newGoals.map(x => ((undefined : any): pttm)));
    // } else {
    //     return inverseTransform(pfconstructor(ncmd, warn, newGoals));
    // }
}


module.exports = {
    defListToCtx,
    pfconstructor,
    newtermChecker,
    pfChecker,
    ppCmd,
    ppCtx,
    ppDefL
}
