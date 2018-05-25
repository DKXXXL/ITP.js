//@flow

// proof constructor : Command -> pttm
// proof constructor only works at type-level
type Dict<K, V> = Array<[K, V]>;


let obeq = (a: Object, b:Object):boolean => (typeof a === typeof b) && (JSON.stringify(a) === JSON.stringify(b));

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

let _add_to_dict = <K, V>(newterm : K, newtype : V, ctx: Dict<K,V>) : Dict<K,V> => {let r = ctx.slice(); r.push([newterm, newtype]); return r;}
let _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : Option<V> => (x => {if(!x){return x[1];}else{return undefined;}})(ctx.filter(x => pred(x[0]))[0]);
let _reverse_mapping = <K, V>(d : Dict<K,V>) : Dict<V,K> => d.map(x => [x[1], x[0]]);

type ValOfCtx = pttm;
type Context = Dict<number, ValOfCtx>;
type DefContext = Dict<number, [pttm, pttm]>;
//type GlobalContext = Context;
type Judgement = [DefContext, Context, pttm];
type Goal = [DefContext, Context, pttm];
type Goals = Array<Goal>
type PartialGoals = Array<Goal | true>
type NewContext = Context;
type NewJudgement = [NewContext, pttm];
type Commands = Array<Command>;
type ArrayF<Domain, Codomain> = [number, Array<Domain> => Array<Codomain>]; // size of doman * function

// homomorphism
let connect = <D,C>(f : ArrayF<D,C>, g: ArrayF<D,C>) : ArrayF<D,C> => {
    const f_ = (a : Array<D>) : Array<C> => f[1](a.slice(0, f[0]));
    const g_ = (a : Array<D>) : Array<C> => g[1](a.slice(f[0], f[0] + g[0]));
    return [f[0] + g[0], a => f_(a).concat(g_(a))];
}



type Command =
    {type : "intro", n : NewJudgement}
    | {type : "apply", caller : NewJudgement, callee : NewJudgement}
    | {type : "check", term : pttm}
    | {type : "conv", newform : NewJudgement} // type level calculation
    | {type : "let", n : number, term : pttm} // local definition
    
let combine = (gs : Array<[PartialGoals, ArrayF<pttm, pttm>]>) : [PartialGoals, ArrayF<pttm, pttm>] => {
    const goals = gs.reduce((x,y) => x[0].concat(y[0]));
    const fs = gs.reduce(connect);
    return [goals, fs];
}
    
let goaltransform = (cmd : Command, goal : Goal | true) : [PartialGoals, ArrayF<pttm, pttm>] => {
    if(goal === true) {
        return [[true], [1, x => x]];
    }
    

}
let pfconstructor = (ncmd : (PartialGoals) => Commands, warn: string => string, currentGoals : PartialGoals) : [pttm] => {
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


