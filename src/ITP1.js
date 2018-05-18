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

let obeq = (a: Object, b:Object):boolean => (typeof a === typeof b) && (JSON.stringify(a) === JSON.stringify(b));

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

let _flatten_all_types = (arrows : ty) : Array<ty> => {if(arrows.type === "TArrow"){return [arrows.domain].concat(_flatten_all_types(arrows.codomain));} else {return [arrows];};}
let _final_type = (arrows : ty) : ty => {if(arrows.type === "TArrow"){return _final_type(arrows.codomain);} else {return arrows;};}


// Actually, Propositional logic solver
let _term_finding = (rctx:Dict<ty, number>, varNo : number, target : ty) : ?pttm => {
    if(target.type === "TArrow") {
        const _body = _term_finding(_add_to_dict(target.domain, varNo, rctx), varNo + 1, target.codomain);
        if(_body !== null && _body !== undefined) {
            return {type: "abs", v : varNo, domty : target.domain,  body: _body};
        } 
        return undefined;
    } else if(target.type === "TVar") {
        // simple find
        const variableNumber = _find_in_dict(x => obeq(x, target), rctx);
        if(variableNumber !== null && variableNumber !== undefined) {
            return {type: "var", t : variableNumber};
        }
        
        const constuction_candidate : Array<ty> = rctx.filter(x => obeq(_final_type(x[0]), target)).map(x => x[0]);
        let array_of_application : Array<pttm> = [];
        for(let candidate of constuction_candidate) {
            const candidate_term_v = _find_in_dict(x => obeq(x, candidate), rctx);
            if(candidate_term_v === null || candidate_term_v === undefined) {continue;}
            const candidate_term = {type : "var", t : candidate_term_v};
            
            let all_types = _flatten_all_types(candidate);
            all_types.splice(all_types.length - 1, 1);
            // remove final type
            // now try to construct each type in the domain to 
            let ingredient : Dict<ty, pttm> = [];
            for(let snd_level_target of all_types) {
                
                const snd_level_ingredient = _term_finding(rctx.filter(x => !obeq(x[0], candidate)), varNo, snd_level_target);
                if(snd_level_ingredient === null || snd_level_ingredient === undefined) {
                    break;
                }
                ingredient.push([snd_level_target, snd_level_ingredient]);
            }
            if(ingredient.length !== all_types.length) {continue;}
            // find the second level ingredient
            // use 'app' to construct them
            let all_type_ingredient : Array<pttm> = all_types.map(
                                                key => (x => x?[x]:[])(_find_in_dict(x => obeq(x, key), ingredient))).reduce((x,y) => x.concat(y));
            
            array_of_application = [candidate_term].concat(all_type_ingredient);
            break;
        }
        if(array_of_application.length != 0) {
            let target_construction : pttm = array_of_application.splice(0, 1)[0];
            for(let each_argument of array_of_application) {
                target_construction = {type : "app", t1 : target_construction, t2 : each_argument};
            }
            return target_construction;
        }
        
        return undefined;
    }
}

