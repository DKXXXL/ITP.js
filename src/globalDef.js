//@flow

const debug = (s : string) => console.log(s + "\n");

export type ID = string;
export type UDEF = typeof undefined;
export type Generator<X> = () => Option<X> ;
const ideq = (x : ID, y : ID) => x === y;
const ppID = (x: ID) :string => x; 
const toID = (x : string) : ID => x;

export type Option<T> = T | typeof undefined;


// Generator -- a lazy (potential) infinite list


// Array -> Generator
const listGen= <X>(l : Array<X>) : Generator<X> => {
    let index = -1;
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

const concat_ =<X>(f : Generator<X>, g : () => Generator<X>):Generator<X> => {
                            let flag = true;
                            let g_ : typeof undefined | Generator<X> = undefined;
                            return () => {
                                if(flag){
                                    const r = f();
                                    if(r !== undefined) {
                                        return r;
                                    } else {
                                        flag = false;
                                        g_ = g();
                                    }
                                }
                                if(g_ === undefined) {
                                    return undefined;
                                } else {
                                    return g_();
                                }
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

const mapGen = <X, Y>(fmap : X => Y, gen : Generator<X>) : Generator<Y> => (() => mapOption(fmap)(gen()));
const mapOption = <X, Y> (fmap : X => Y):(Option<X> => Option<Y>) => x => {
    if(x === undefined) {return undefined;} else {return fmap(x);}
}
const endswith = <X>(x : X, gen : Generator<X>): (() => X) => {
    return () => {
        const ret = gen();
        if(ret === undefined) {return x;}
        return ret;
    };
}

const printf = (proto : string, ...xs:Array<string>):string => {
        xs.map((x, index) => {proto = proto.replace("{" + String(index) + "}", x)}); 
        return proto;
        }


export type Dict<K, V> = Array<[K, V]>;


const obeq = (a: ?Object, b:?Object):boolean => (typeof a === typeof b) && (JSON.stringify(a) === JSON.stringify(b));

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

const _add_to_dict = <K, V>(newterm : K, newtype : V, ctx: Dict<K,V>) : Dict<K,V> => {let r = ctx.slice(); r.push([newterm, newtype]); return r;}
const _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : Option<V> => (x => {if(!x){return x[1];}else{return undefined;}})(ctx.filter(x => pred(x[0]))[0]);
const _reverse_mapping = <K, V>(d : Dict<K,V>) : Dict<V,K> => d.map(x => [x[1], x[0]]);

const toArray = <X>(d : Dict<number, X>):Array<X> => {
    let i = 0;
    let ret : Array<X> = [];
    while(true) {
        const result : Option<X> = (_find_in_dict(j => j === i, d));
        if(result === undefined){return ret;}
        ret.push(result);
    }
    return ret;
}

const toArrayFillBlankWith = <X>(d : Dict<number, X>, maxItemNumber : number, x : X):Array<X> => 
    Array(maxItemNumber).fill(undefined).map((__x, index) => {
        const ret = _find_in_dict(j => j === index, d); 
        if(ret !== undefined){return ret;}else{return x;}
    });


const pprintDict = <K,V>(pk : K => string, pv : V => string) :( Dict<K,V> => string) => 
    d => d.map((kv) => pk(kv[0]) + " : " + pv(kv[1])).join(",")



module.exports = {ideq, ppID, obeq, toID, debug, printf,
                    concat, concat_, joinGen, mapGen, toArrayFillBlankWith, endswith, listGen, 
                    _add_to_dict, _find_in_dict, _reverse_mapping, pprintDict};

