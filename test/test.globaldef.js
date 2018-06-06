const jsc = require("jsverify");
const _ = require("underscore");

import {ideq, ppID, obeq, toID, debug, printf,
                    concat, concat_, joinGen, mapGen, toArrayFillBlankWith, endswith, listGen, 
                    _add_to_dict, _find_in_dict, _reverse_mapping, pprintDict} from "../src/globalDef"

const genLenth = (gen) => {
    let n = 0;
    while(gen() !== undefined) {
        n = n + 1;
    }
    return n;
}

describe(
    "listGen -",
    () => {
        jsc.property("same length", "array nat", 
        (arr) => genLenth(listGen(arr)) === arr.length);
    }
)

describe(
    "concat -",
    () => {
        jsc.property("length combined", "array nat", "array nat", 
            (arr1, arr2) => genLenth(concat(listGen(arr1), listGen(arr2))) === arr1.length + arr2.length
        )
    }
)

describe(
    "concat_ -",
    () => {
        jsc.property("length combined", "array nat", "array nat", 
            (arr1, arr2) => genLenth(concat_(listGen(arr1), () => listGen(arr2))) === arr1.length + arr2.length
        )
    }
)

describe(
    "joinGen -",
    () => {
        jsc.property("length correct", jsc.array(jsc.array(jsc.nat)),
            (arrofarr) => genLenth(
                                joinGen(listGen(arrofarr.map(listGen)))
                                ) === arrofarr.map(x => x.length).reduce((x, y) => x+y, 0)
        );
    }
)

describe(
    "_find_in_dict - shadowing",
    () => {
        jsc.property("shadowing", "nat",
        (n) => {
            let d = [];
            d = _add_to_dict(0, 0, d);
            d = _add_to_dict(0, n, d);
            return _find_in_dict(x => x === 0, d) === 0;
        }
        )
    }

)

const zip = (a, b) => 
    {   
        if(a.length > b.length) {
            const c = a;
            a = b;
            b = c;
        } 
        return a.map((x, index) => [x, b[index]]);
    }



describe(
    "toArrayFillBlankWith -",
    () => {
        jsc.property("sanity", jsc.array(jsc.nat), jsc.array(jsc.json), jsc.nat(100), jsc.json, 
        (as, xs, range, target) => {
            as = as.filter(x => x <= range);
            const dic = zip(as, xs);
            const res = toArrayFillBlankWith(dic, range, target);
            let j = 0;
            let k = undefined;
            for(j = 0; j < range; j = j + 1) {
                if((k = _find_in_dict(i => i === j, dic)) !== undefined) {
                    if(!_.isEqual(res[j], k)) {return false;}
                } else {
                    if(!_.isEqual(res[j], target)) {return false;}
                }
            }
            return true;
            
        }
        )
    }

)