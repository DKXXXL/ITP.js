//@flow
import * from ITP2
// proof constructor : Command -> pttm
// proof constructor only works at type-level
type Dict<K, V> = Array<[K, V]>;


const obeq = (a: Object, b:Object):boolean => (typeof a === typeof b) && (JSON.stringify(a) === JSON.stringify(b));

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

const _add_to_dict = <K, V>(newterm : K, newtype : V, ctx: Dict<K,V>) : Dict<K,V> => {let r = ctx.slice(); r.push([newterm, newtype]); return r;}
const _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : Option<V> => 
        (x_ => {const x = x_[x_.length - 1]; if(!x){return x[1];}else{return undefined;}})(ctx.filter(x => pred(x[0])));
const _reverse_mapping = <K, V>(d : Dict<K,V>) : Dict<V,K> => d.map(x => [x[1], x[0]]);

type ValOfCtx = [pttm | "bottom" | false, pttm]; // definee & its type, if its definee is bottom, its primitive definition; if it is false, then it is in context

type Context = Dict<number, ValOfCtx>;
const addCtx = _add_to_dict;
const findinCtx = (ctx: Context, n:number) => _find_in_dict(j => n === j, ctx);
//type DefContext = Dict<number, [pttm, pttm]>;
//type GlobalContext = Context;
type Judgement = [Context, pttm];
type Goal = [Context, pttm];
type Goals = Array<Goal>
type PartialGoals = Array<Goal | true>
type NewContext = Context;
type NewJudgement = pttm;
type Commands = Array<Command>;
type ArrayF<Domain, Codomain> = [number, Array<Domain> => Array<Codomain>]; // size of doman * function

// homomorphism
const connect = <D,C>(f : ArrayF<D,C>, g: ArrayF<D,C>) : ArrayF<D,C> => {
    const f_ = (a : Array<D>) : Array<C> => f[1](a.slice(0, f[0]));
    const g_ = (a : Array<D>) : Array<C> => g[1](a.slice(f[0], f[0] + g[0]));
    return [f[0] + g[0], a => f_(a).concat(g_(a))];
}



type Command =
    {type : "intro"}
    | {type : "apply", caller : NewJudgement, callee : NewJudgement}
    | {type : "check", term : pttm}
    | {type : "conv", newform : NewJudgement} // type level calculation
    | {type : "let", n : number, term : pttm} // local definition
    
const combine = (gs : Array<[PartialGoals, ArrayF<pttm, pttm>]>) : [PartialGoals, ArrayF<pttm, pttm>] => {
    const goals = gs.reduce((x,y) => x[0].concat(y[0]));
    const fs = gs.reduce(connect);
    return [goals, fs];
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
        const replacement0 : ValOfContext = (findinCtx(ctx, tm.n));
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

const goaltransform = (warn : string => string; cmd : Command, goal_ : Goal | true) : [PartialGoals, ArrayF<pttm, pttm>] => {
    const goal = goal_;
    if(goal === true) {
        return [[true], [1, x => x]];
    }
    // Now goal is not true
    let ctx = goal[0];
    let goal_ty = goal[1];
    if(cmd.type === "intro") {
        // check truely a function
        if(goal_ty.type !== "pi") {warn("Intro failed."); return [[goal], x => x];}
        return [[[addCtx(goal_ty.bind, [false, goal_ty.iT], ctx), goal_ty.body]],
                x => [{type : "lambda", bind : goal_ty.bind, iT : goal_ty.iT, x[0]}] ];
    } else if (cmd.type === "apply") {
        const claimed_fty = cmd.caller;
        const claimed_xty = cmd.callee;
        const ctx_list = ctx.map(x => [x[0], x[1][1]]);
        const type_of_claimed_f = has_type(ctx_list, claimed_fty);
        const type_of_claimed_x = has_type(ctx_list, claimed_xty);
        if(type_of_claimed_f === undefined || !obeq(type_of_claimed_f, TYPE_STAR) 
            || type_of_claimed_x === undefined || !obeq(type_of_claimed_f, TYPE_STAR)) {warn("Apply failed. Type Inconsistent."); return [[goal], x => x];}
        if(claimed_fty.type !== "pi") {warn("Apply failed. Type Inconsistent."); return [[goal], x => x];}
        if(!obeq(claimed_fty.iT, claimed_xty)) {warn("Apply failed. Type Inconsistent."); return [[goal], x => x];}
        return [
                [[ctx, claimed_fty],
                 [ctx, claimed_xty]] : PartialGoals,
                 x => [{type: "apply", fun : x[0], arg: x[1]}];
                ];
    } else if (cmd.type === "check") {
        const claimed_term = cmd.term;
        const claimed_term_ty = has_type(ctx, claimed_term);
        if(claimed_term_ty !== goal_ty) {warn("Check failed. Type Inconsistent."); return [[goal], x => x];}
    } else if (cmd.type === "conv") {
        const claimed_ty = cmd.newform;
        // now beta, delta conversion
        const ty_claimed_ty = has_type(ctx, claimed_ty);
        if(ty_claimed_ty === undefined) {warn("Conversion failed. Types are not equivalent."); return [[goal], x => x];}
        if(!obeq(untyped_beta_delta_conv_all(ctx, claimed_ty), untyped_beta_delta_conv_all(ctx, goal_ty))) {warn("Conversion failed. Types are not equivalent."); return [[goal], x => x];}
        return [[ctx, claimed_ty], x => x];
        
    } else if (cmd.type === "let") {
        const new_add_term = cmd.term;
        const new_add_term_ty = has_type(ctx, new_add_term);
        if(new_add_term_ty === undefined)) {warn("Local Define failed. Unsupported type"); return [[goal], x => x];}
         return [[[addCtx(cmd.bind, [new_add_term, new_add_term_ty], ctx), goal_ty]],
                x => [  {type: "apply",
                            fun : {type : "lambda", bind : cmd.bind, iT : new_add_term_ty, x[0]},
                            arg : new_add_term
                        }
                        ] ];
    }
    

}
const pfconstructor = (ncmd : (PartialGoals) => Commands, warn: string => string, currentGoals : PartialGoals) : [pttm] => {
    let nextcmds_ = ncmd(currentGoals);
    while(nextcmds.length !== currentGoals.length) {
        warn("Error: Command number not enough");
        nextcmds_ = ncmd(currentGoals);
    }
    const nextcmds = nextcmds_;
    const newGoals_IT = combine(nextcmds.map((cmd, index) => goaltransform(cmd, currentGoals[index])));
    const newGoals = newGoals_IT[0];
    const inverseTransform = newGoals_IT[1];
    if(newGoals.filter(x => x !== true).length === 0) {
        return inverseTransform[1](newGoals.map(x => ((undefined : any): pttm)));
    } else {
        return inverseTransform[1](pfconstructor(ncmd, warn, newGoals));
    }
}


