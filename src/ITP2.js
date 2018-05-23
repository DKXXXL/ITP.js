//@flow


type Dict<K, V> = Array<[K, V]>;


let obeq = (a: Object, b:Object):boolean => (typeof a === typeof b) && (JSON.stringify(a) === JSON.stringify(b));

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

let _add_to_dict = <K, V>(newterm : K, newtype : V, ctx: Dict<K,V>) : Dict<K,V> => {let r = ctx.slice(); r.push([newterm, newtype]); return r;}
let _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : Option<V> => (x => {if(!x){return x[1];}else{return undefined;}})(ctx.filter(x => pred(x[0]))[0]);
let _reverse_mapping = <K, V>(d : Dict<K,V>) : Dict<V,K> => d.map(x => [x[1], x[0]]);



// Calculus of Construction
// pttm = pre-typed term
type pttm = 
    {type : "U1"}               // Universe level 1
    | {type : "U0"}             // Universe level 0
    | {type : "apply", fun : pttm, arg : pttm}
    | {type : "lambda", bind : number, iT : pttm, body : pttm}
    | {type : "pi", bind : number, iT : pttm, body : pttm}
    | {type : "var", n : number};
    
type ty = pttm;
type Context = Dict<number, ty>;
type Option<T> = T | typeof undefined;


let subst = (exp : pttm, from : number, to : pttm) : pttm => {
    let sb = (subexp : pttm) : pttm => subst(subexp, from, to);
    if(((exp.type === "lambda")) && exp.bind !== from) {
        return {type: "lambda", bind : exp.bind, iT : exp.iT, body : sb(exp.body)};
    } else if(( (exp.type === "pi")) && exp.bind !== from) {
        return {type: "pi", bind : exp.bind, iT : exp.iT, body : sb(exp.body)};
    } else if (exp.type === "apply") {
        return {type : "apply", fun: sb(exp.fun), arg: sb(exp.arg)};
    } else if (exp.type === "var" && exp.n === from) {
        return to;
    } 
    return exp;
}


let untyped_beta_conversion = (tm : pttm) : pttm => {
    if(tm.type === "lambda") {
        return {type : "lambda", bind : tm.bind, iT : tm.iT, body : untyped_beta_conversion(tm.body)};
    } else if(tm.type === "pi") {
        return {type : "pi", bind : tm.bind, iT : tm.iT, body : untyped_beta_conversion(tm.body)};
    } else if(tm.type === "apply") {
        let f = untyped_beta_conversion(tm.fun);
        let x = untyped_beta_conversion(tm.arg);
        if(f.type === "lambda") {
            return subst(f.body, f.bind, x);
        }
    }
    return tm;
}

// One specification: beta_conversion(has_type(..)) === has_type(..)
// Another : beta_conversion(find_in_dict(..)) == find_in_dict(..)
let has_type = (ctx : Context, tmm : pttm) : Option<ty> => {
    // I don't need to hard-code them
    const tm = tmm;
    if(tm.type === "U1") {
        return {type : "U1"};
    } else if(tm.type === "U0") {
        return {type : "U1"};
    } else if(tm.type === "apply") {
        let f = tm.fun;
        let x = tm.arg;
        let fT = has_type(ctx, f);
        let xT = has_type(ctx, x);
        if((fT === undefined) || (xT === undefined) || (fT.type !== "pi")  || !obeq(fT.iT, xT)) {
            return undefined;
        }
        return subst(fT.body, fT.bind, x);
    } else if (tm.type === "lambda") {
        let iTT = has_type(ctx, tm.iT);
        if(iTT === undefined || (iTT.type !== "U1" && iTT.type !== "U0")) {return undefined;}
        let oT = has_type(_add_to_dict(tm.bind, untyped_beta_conversion(tm.iT), ctx), tm.body);
        if(oT === undefined || (iTT.type !== "U1" && iTT.type !== "U0")) {return undefined};
        return {type : "pi", bind : tm.bind, iT : tm.iT, body : oT};
    } else if(tm.type === "pi") {
        let iTT = has_type(ctx, tm.iT);
        if(iTT === undefined || (iTT.type !== "U1" && iTT.type !== "U0")) {return undefined;}
        let oT = has_type(_add_to_dict(tm.bind, untyped_beta_conversion(tm.iT), ctx), tm.body);
        if(oT === undefined || (iTT.type !== "U1" && iTT.type !== "U0")) {return undefined};
        return oT;
    } else if(tm.type === "var") {
        return _find_in_dict(x => x === tm.n, ctx);
    }
}
