const jsc = require("jsverify");
const _ = require("underscore");

import {    untyped_beta_conversion,
    has_type,
    TYPE_STAR,
    TYPE_SQUARE,
    obeq,
    _add_to_dict,
    _find_in_dict,
    _reverse_mapping,
    pprintDict,
    ppPttm} from "../src/ITP2"

const VAR = (s) =>({type : "var", n: s});


describe(
    "sanity check -",
    () => {
        jsc.property("sort",
                () => _.isEqual(has_type([], TYPE_STAR), TYPE_SQUARE)
            );
        jsc.property("var", jsc.elements([TYPE_SQUARE, TYPE_STAR]),
                (sort) => _.isEqual(has_type([["A", sort], ["x", VAR("A")]], VAR("x")), VAR("A"))
        );

        jsc.property("form", jsc.elements([TYPE_SQUARE, TYPE_STAR]), jsc.elements([TYPE_SQUARE, TYPE_STAR]),
                (sort1, sort2) => _.isEqual(has_type([["A", sort1], ["B", sort2]], {type: "pi", bind : "x", iT : VAR("A"), body : VAR("B")}), sort2)
        );
    }
)
