const jsc = require("jsverify");
const _ = require("underscore");

import {langTerm, langCommand, langTactic, langTTactic, langInstructionGen} from "../lib/front/parser.ITP3"
import {printf} from "../lib/globalDef"




const addSpace = (n, m, s) => " ".repeat(n) + s + " ".repeat(m) 
const WS = (n) => " ".repeat(n)

const STAR = {type : "U0"};


const termP = (x) => langTerm.Value.tryParse(x);
const sanityCheckOfTerm = [
    () => jsc.property("term - U1", "nat", "nat", (n, m) => _.isEqual(termP(addSpace(n, m, "**")), {type : "U1"})),
    () => jsc.property("term - U0", "nat", "nat", (n, m) => _.isEqual(termP(addSpace(n, m, "*")), STAR)),
    () => jsc.property("term - Lambda", "nat", "nat", (n, m, j) => _.isEqual(termP(printf("\\\\x:*,*")), 
                                                                             {type: "lambda", bind : "x", iT : STAR, body : STAR})),
    () => jsc.property("term - Pi", () => termP("forall x:*, x").type === "pi"),
    () => jsc.property("term - App", () => termP("(A B)").type === "apply"),
    () => jsc.property("term - var", () => termP("1").type === "var") // surprise!
                                                                        
]

const cmdP  = (x) => langCommand.Cmd.tryParse(x);
const sanityCheckOfCommand = [
    () => jsc.property("intro", () => cmdP("intro").type === "intro"),
    () => jsc.property("apply", () => cmdP("apply [forall x:**, x] [*]").type === "apply"),
    () => jsc.property("check", () => cmdP("check [forall x:*, x]").type === "check"),
    () => jsc.property("conv", () => cmdP("conv [forall x:*, x]").type === "conv"),
    () => jsc.property("let - define term", () => cmdP("let 1 := [forall x:*, x]").type === "let"),
    () => jsc.property("idtac", () => cmdP("idtac").type === "idtac")
]

const tacP = (x) => langTTactic.all.tryParse(x);
const sanityCheckOfTactic = [
    () => jsc.property("intro", () => tacP("intro.")[0][1].t.type === "intro"),
    () => jsc.property("apply", () => tacP("apply [forall x:**, x] [*].")[0][1].t.type === "apply"),
    () => jsc.property("check", () => tacP("check [forall x:*, x].")[0][1].t.type === "check"),
    () => jsc.property("conv", () => tacP("conv [forall x:*, x].")[0][1].t.type === "conv"),
    () => jsc.property("let - define term", () => tacP("let 1 := [forall x:*, x].")[0][1].t.type === "let"),
    () => jsc.property("idtac", () => tacP(" idtac .")[0][1].t.type === "idtac"),
    () => jsc.property("seq", () => ((x) => tacP(" [idtac ; idtac].")[0][1].type === "seq")),
    () => jsc.property("let tac", () => tacP("lettac x := [ idtac ] in x.")[0][1].type === "let"),
    () =>jsc.property("metavar", () => tacP("a.")[0][1].type === "metavar"),
]

const instrPgen = langInstructionGen(x => undefined, x => undefined);
const instrP = (x) => instrPgen.all.tryParse(x);
const sanityCheckofInstr = [
    () => jsc.property("addDef", () => instrP("addDef 1:**.").type === "addDef"),
    () => jsc.property("addTactic", () => instrP("addTactic a := a.").type === "addTactic"),
    () => jsc.property("printScript", () => instrP("printScript.").type === "printScript")
]

describe(
    "sanity check - term", () => sanityCheckOfTerm.map(x => x())
);

describe(
    "sanity check - cmd", () => sanityCheckOfCommand.map(x => x())
);

describe(
    "sanity check - tactic", () => sanityCheckOfTactic.map(x => x())
);

describe(
    "sanity check - Instr", () => sanityCheckofInstr.map(x => x())
);




