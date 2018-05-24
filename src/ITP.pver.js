
type Dict<K, V> = Array<[K, V]>;


let obeq = (a: Object, b:Object):boolean => (typeof a === typeof b) && (JSON.stringify(a) === JSON.stringify(b));

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

let _add_to_dict = <K, V>(newterm : K, newtype : V, ctx: Dict<K,V>) : Dict<K,V> => {let r = ctx.slice(); r.push([newterm, newtype]); return r;}
let _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : Option<V> => (x => {if(!x){return x[1];}else{return undefined;}})(ctx.filter(x => pred(x[0]))[0]);
let _reverse_mapping = <K, V>(d : Dict<K,V>) : Dict<V,K> => d.map(x => [x[1], x[0]]);

type ValOfCtx = [pttm, pttm];
type Context = Dict<number, ValOfCtx>;
type GlobalContext = Context;
type Judgement = [Context, pttm];
type Goal = [Context, pttm];
type Goals = Array<Goal>
type NewContext = Context;
type NewJudgement = [NewContext, pttm];
type Commands = Array<Command>;


type Command =
    {type : "intro", n : NewJudgement}
    | {type : "apply", caller : NewJudgement, callee : NewJudgement}
    | {type : "check", term : pttm, ty : pttm}
    
let goaltransform = (cmd : Command, goal : Goal) : Goals => {
        
}
let pfconstructor = (ncmd : (Goals) => Commands, warn: string => string, currentGoals : Goals) : pttm => {
    let nextcmds_ = ncmd(currentGoals);
    while(nextcmds.length !== currentGoals.length) {
        warn("Error: Command number not enough");
        nextcmds_ = ncmd(currentGoals);
    }
    const nextcmds = nextcmds_;
    
}


