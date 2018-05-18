//@flow

// STLC

// type
type ty =
    {type : "TArrow", domain : ty, codomain : ty}
    | {type : "TVar", val : number}

// pre-typed term
type pttm = 
     {type : "abs", v: number, domty: ty, body : pttm} 
    | {type : "var", t : number}
    | {type : "app", t1 : pttm, t2 : pttm}
    
    
type Dict<K, V> = Array<[K, V]>;
type Context = Dict<number, ty>;

let obeq = (a: Object, b:Object):boolean => JSON.stringify(a) === JSON.stringify(b);

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

let _add_to_dict = <K, V>(newterm : K, newtype : V, ctx: Dict<K,V>) : Dict<K,V> => {let r = ctx.slice(); r.push([newterm, newtype]); return r;}
let _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : ?V => (x => {if(!x){return x[1];}})(ctx.filter(x => pred(x[0]))[0]);
let _reverse_mapping = <K, V>(d : Dict<K,V>) : Dict<V,K> => d.map(x => [x[1], x[0]]);


let _add_to_ctx = (newterm : number, newtype : ty, ctx: Context) : Context => _add_to_dict(newterm, newtype, ctx);
let _find_in_ctx = (term : number, ctx : Context) : ?ty => _find_in_dict(x => x == term, ctx);
               
let type_checking = (ctx: Context, exp : pttm) : ?ty => {
    if(exp.type === "abs") {
        return type_checking(_add_to_ctx(exp.v, exp.domty, ctx), exp.body);
    } else if(exp.type === "var") {
        return _find_in_ctx(exp.t, ctx);
    } else if(exp.type === "app") {
        let funTy = type_checking(ctx, exp.t1);
        let argTy = type_checking(ctx, exp.t2);
        if(argTy !== null && argTy !== undefined) {
            if(funTy !== null && funTy !== undefined) {
                if(funTy.type === "TArrow" && obeq(funTy.domain, argTy)) {
                    return funTy.codomain;
                }
            }

        }

        
    }
    return undefined;
    
}


let term_finding = (ctx:Context, target : ty) : ?pttm => {
    if(target.type === "TArrow") {
        
    }
}

