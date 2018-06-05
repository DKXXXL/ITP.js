const jsc = require("jsverify");
const _ = require("underscore");

import {langTerm, langCommand, langTactic, langTTactic, langInstructionGen} from "../lib/front/parser.ITP3"
import {printf} from "../lib/globalDef"

const termP = (x) => langTerm.Value.tryParse(x);

const addSpace = (n, m, s) => " ".repeat(n) + s + " ".repeat(m) 
const WS = (n) => " ".repeat(n)

const STAR = {type : "U0"};

const sanityCheck = [
    () => jsc.property("term - U1", "nat", "nat", (n, m) => _.isEqual(termP(addSpace(n, m, "**")), {type : "U1"})),
    () => jsc.property("term - U0", "nat", "nat", (n, m) => _.isEqual(termP(addSpace(n, m, "*")), STAR)),
    () => jsc.property("term - Lambda", "nat", "nat", (n, m, j) => _.isEqual(termP(printf("\\\\{0}x:*,*", )), 
                                                                             {type: "lambda", }))
]

describe(
    "sanity check", () => {
        sanityCheck.map(x => x());
    }
);