const jsc = require("jsverify");
const _ = require("underscore");

import {langTerm, langCommand, langTactic, langTTactic, langInstructionGen} from "../lib/front/parser.ITP3"


const termP = (x) => langTerm.Value.tryParse(x);

const addSpace = (n, m, s) => " ".repeat(n) + s + " ".repeat(m) 

const sanityCheck = [
    () => jsc.property("term - U1", "nat", "nat", (n, m) => _.isEqual(termP(addSpace(n, m, "**")), {type : "U1"})),
    () => jsc.property("term - U0", "nat", "nat", (n, m) => _.isEqual(termP(addSpace(n, m, "*")), {type : "U0"})),
    
]

describe(
    "sanity check", () => {
        sanityCheck.map(x => x());
    }
);