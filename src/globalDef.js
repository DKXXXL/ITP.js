//@flow

const debug = (s : string) => undefined // console.log(s + "\n");
const warn = (s: string) => process.stderr.write(s);

export type ID = string;
export type UDEF = typeof undefined;
export type Generator_<X> = () => Option<X> ;
export type IO<X> = () => Generator<any, X, any>;
export type GR<X> = Generator<any, X, any>;
const ideq = (x : ID, y : ID) => x === y;
const ppID = (x: ID) :string => x; 
const toID = (x : string) : ID => x;

export type Option<T> = T | typeof undefined;


// Generator_ -- a lazy (potential) infinite list

const constGer = <X>(c : X): IO<X> => () => function* () {return c;}()


// Array -> Generator_
const listGen= <X>(l : Array<X>) : Generator_<X> => {
    let index = -1;
    return () => {
        index = index + 1;
        return l[index];
    }
}


const concat = <X>(f : Generator_<X>, g : Generator_<X>):Generator_<X> => {
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

const concat_ =<X>(f : Generator_<X>, g : () => Generator_<X>):Generator_<X> => {
                            let flag = true;
                            let g_ : typeof undefined | Generator_<X> = undefined;
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
const joinGen = <X>(f : Generator_<Generator_<X>>) : Generator_<X> => {
    let firsttime = true;
    let current = undefined;
    return () => {
        if(firsttime === true) {current = f(); firsttime = false;}
        let r : Option<X> = undefined;
        while(current !== undefined) {
            r = current();
            if(r === undefined) {
                current = f();
            } else {
                return r;
            }
        }
        return undefined;
    };
};

const mapGen = <X, Y>(fmap : X => Y, gen : Generator_<X>) : Generator_<Y> => (() => mapOption(fmap)(gen()));
const mapOption = <X, Y> (fmap : X => Y):(Option<X> => Option<Y>) => x => {
    if(x === undefined) {return undefined;} else {return fmap(x);}
}
const endswith = <X>(x : X, gen : Generator_<X>): (() => X) => {
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
const _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : Option<V> => ((x => {if(x !== undefined){return x[1];}else{return undefined;}})(ctx.filter(x => pred(x[0]))[0]));
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
    d => d.map((kv) => pk(kv[0]) + " : " + pv(kv[1])).join(",\n")


const gen_not_null = <X> (g : Generator_<X>) :(() => X) => 
    () => {
        let ret = g();
        while(ret === undefined) {
            ret = g();
        }
        return ret;
    }

const gerDelay = <X,Y>(g :IO<X => Y>) : (X => IO<Y>) => 
    x =>
        function*() {
            let f = yield* g();
            return f(x);
        }

{/* const gerForward = <X,Y> (g : X => IO<Y>) : (IO<X => Y>) => 
    function* () {
        return x => {
            const c = yield* g(x);
            return c;
        }
    }() */}



// IO<X> = () => Generator<X, X, any>
const gerFlat = <X> (g : IO<IO<X>>) : IO<X> => 
        function *() {
            const f : IO<X> = yield* g();
            const x : X = yield* f();
            return x;
        }

const gen_to_ger = <X> (g : Generator_<X>) : IO<X> => 
    function* () {
        let ret = g();
        while(ret == undefined) {
            ret = g();
        }
        return ret;
    }

const map_ger = <X, Y> (f : X => Y, g : IO<X>) : IO<Y> =>
    function* () {
        let c : X = yield* g();
        return f(c);
    }

const ger_gen__ger = <X> (g : IO<Generator_<X>>) : IO<X> => {
    let f : GR<Generator_<X>> = g();
    let r : Generator_<X> | UDEF = undefined;
    return function* () {
            if(r === undefined) {
                r = yield* f;
            }
            let ret : X = (r.value)();
            while(ret === undefined) {
                f = g();
                r = yield* f;
                ret = (r.value)();
            }
            return ret;
        };
}
module.exports = {ideq, ppID, obeq, toID, debug, printf, warn,
                    concat, concat_, joinGen, mapGen, toArrayFillBlankWith, endswith, listGen, 
                    _add_to_dict, _find_in_dict, _reverse_mapping, pprintDict,
                    constGer, gerDelay,  gerFlat, gen_to_ger, map_ger, ger_gen__ger
                    };

