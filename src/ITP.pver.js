//@flow

// A prover : Extend Coc with definition, become lambdaD
// should named as ITP3.js

import type {pttm, Dict, Option} from "./ITP2" 
import {
    untyped_beta_conversion,
    has_type,
    TYPE_STAR,
    TYPE_SQUARE,
    obeq,
    _add_to_dict,
    _find_in_dict,
    _reverse_mapping
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

export type Context = Dict<number, ValOfCtx>;
const addCtx = _add_to_dict;
const findinCtx = (ctx: Context, n:number) => _find_in_dict(j => n === j, ctx);
//type DefContext = Dict<number, [pttm, pttm]>;
//type GlobalContext = Context;
type Judgement = [Context, pttm];
export type Goal = [Context, pttm];
export type Goals = Array<Goal>
export type PartialGoals = Array<Goal | true>
type NewContext = Context;
export type NewJudgement = pttm;
export type Commands = Array<Command>;
type ArrayF<Domain, Codomain> = [number, Array<Domain> => Array<Codomain>]; // size of doman * function
export type DefinitionList = Dict<number, [pttm, pttm]>;

// homomorphism
const connect = <D,C>(f : ArrayF<D,C>, g: ArrayF<D,C>) : ArrayF<D,C> => {
    const f_ = (a : Array<D>) : Array<C> => f[1](a.slice(0, f[0]));
    const g_ = (a : Array<D>) : Array<C> => g[1](a.slice(f[0], f[0] + g[0]));
    return [f[0] + g[0], a => f_(a).concat(g_(a))];
}



export type Command =
    {type : "intro"}
    | {type : "apply", caller : NewJudgement, callee : NewJudgement}
    | {type : "check", term : pttm}
    | {type : "conv", newform : NewJudgement} // type level calculation
    | {type : "let", bind: number, term : pttm} // local definition
    
const combine = (gs : Array<[PartialGoals, ArrayF<pttm, pttm>]>) : [PartialGoals, ArrayF<pttm, pttm>] => {
    return gs.reduce((x,y) => [x[0].concat(y[0]), connect(x[1], y[1])]);

}
    
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



// prerequisite : ctx is consistent
const newtermChecker = (ctx : DefinitionList, newbind: number, newterm : pttm, decType : pttm) : boolean => {
    if(_find_in_dict(x => x === newbind, ctx) !== undefined) {return false;}
    if(!obeq(has_type(ctx.map(x => [x[0], x[1][1]]), newterm),decType)) {return false;}
    return true;
}

const pfChecker = (ctx : DefinitionList) : boolean => {
    const oldlist = ctx.slice(0, ctx.length - 1);
    return pfChecker(oldlist) && 
            newtermChecker(oldlist, ctx[ctx.length-1][0], ctx[ctx.length-1][1][0], ctx[ctx.length-1][1][1]);
}

const goaltransform = (warn: string => typeof undefined, cmd_ : Command, goal_ : Goal | true) : [PartialGoals, ArrayF<pttm, pttm>] => {
    
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
        const claimed_term = cmd.term;
        const claimed_term_ty = has_type(ctx_list, claimed_term);
        if(claimed_term_ty !== goal_ty) {warn("Check failed. Type Inconsistent."); return [[goal], donothing];}
    } else if (cmd.type === "conv") {
        const claimed_ty = cmd.newform;
        // now beta, delta conversion
        const ty_claimed_ty = has_type(ctx_list, claimed_ty);
        if(ty_claimed_ty === undefined) {warn("Conversion failed. Types are not equivalent."); return [[goal], donothing];}
        if(!obeq(untyped_beta_delta_conv_all(ctx, claimed_ty), untyped_beta_delta_conv_all(ctx, goal_ty))) {warn("Conversion failed. Types are not equivalent."); return [[goal], donothing];}
        return [[[ctx, claimed_ty]], [1, x => x]];
        
    } else if (cmd.type === "let") {
        const new_add_term = cmd.term;
        const new_add_term_ty = has_type(ctx_list, new_add_term);
        if(new_add_term_ty === undefined) {warn("Local Define failed. Unsupported type"); return [[goal], donothing];}
         return [[[addCtx(cmd.bind, [new_add_term, new_add_term_ty], ctx), goal_ty]],
                [1, x => [  {type: "apply",
                            fun : {type : "lambda", bind : cmd.bind, iT : new_add_term_ty, body : x[0]},
                            arg : new_add_term
                        }
                        ]] ];
    }
        // Should not be happening
    warn("Unexpected internal error"); 
    return [[goal], donothing];
}

const pfconstructor = (ncmd : (PartialGoals) => Commands, warn: string => typeof undefined, currentGoals : PartialGoals) : Array<pttm> => {
    let nextcmds_ = ncmd(currentGoals);
    while(nextcmds_.length !== currentGoals.length) {
        warn("Error: Command number not enough");
        nextcmds_ = ncmd(currentGoals);
    }
    const nextcmds : Commands = nextcmds_;
    const newGoals_IT : [PartialGoals, ArrayF<pttm, pttm>] = combine(nextcmds.map((cmd, index) => goaltransform(warn, cmd, currentGoals[index])));
    const newGoals : PartialGoals = newGoals_IT[0];
    if(newGoals_IT[1][0] !== newGoals.length) {warn("Internal Error: Domain number incoincides with array element number");}
    const inverseTransform : Array<pttm> => Array<pttm> = newGoals_IT[1][1];
    if(newGoals.filter(x => x !== true).length === 0) {
        return inverseTransform(newGoals.map(x => ((undefined : any): pttm)));
    } else {
        return inverseTransform(pfconstructor(ncmd, warn, newGoals));
    }
}

module.exports = {
    pfconstructor,
    newtermChecker,
    pfChecker
}
