const jsc = require("jsverify");
const _ = require("underscore");

import {langTerm, langCommand, langTactic, langTTactic, langInstruction} from "../src/front/parser.ITP3"
import {printf} from "../src/globalDef"




const addSpace = (n, m, s) => " ".repeat(n) + s + " ".repeat(m) 
const WS = (n) => " ".repeat(n)

const STAR = {type : "U0"};

const VAR = (s) =>({type : "var", n: s});

const termP = (x) => langTerm.Value.tryParse(x);
const sanityCheckOfTerm = [
    () => jsc.property("term - U1", "nat", "nat", (n, m) => _.isEqual(termP(addSpace(n, m, "**")), {type : "U1"})),
    () => jsc.property("term - U0", "nat", "nat", (n, m) => _.isEqual(termP(addSpace(n, m, "*")), STAR)),
    () => jsc.property("term - Lambda", "nat", "nat", (n, m, j) => _.isEqual(termP(printf("\\\\x:*,*")), 
                                                                             {type: "lambda", bind : "x", iT : STAR, body : STAR})),
    () => jsc.property("term - Pi", () => _.isEqual(termP("forall x:*, *"), {type : "pi", bind : "x", iT : STAR, body : STAR})),
    () => jsc.property("term - App", () => _.isEqual(termP("(A B)"),
                                                            {type : "apply", fun : VAR("A"), arg : VAR("B")})),
    () => jsc.property("term - var", () => _.isEqual(termP("1"), VAR("1"))) // surprise!
                                                                        
]

const cmdP  = (x) => langCommand.Cmd.tryParse(x);


const sanityCheckOfCommand = [
    () => jsc.property("intro", () => _.isEqual(cmdP("intro"), {type: "intro"})),
    () => jsc.property("apply", () => _.isEqual(cmdP("apply [forall x:**, x] [*]"), {type:"apply", caller: {type : "pi", bind : "x", iT : {type : "U1"}, body : VAR("x")}, callee : STAR})),
    () => jsc.property("check", () => _.isEqual(cmdP("check [x]"), {type : "check", term : VAR("x")})),
    () => jsc.property("conv", () => _.isEqual(cmdP("conv [x]"), {type : "conv", term : VAR("x")})),
    () => jsc.property("let - define term", () => _.isEqual(cmdP("let 1 := [x]"), {type : "let", bind : "1", term : VAR("x")})),
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


const instrP = (x) => langInstruction.all.tryParse(x);
const sanityCheckofInstr = [
    () => jsc.property("addDef", () => _.isEqual(instrP("addDef 1:**."),{type : "addDef", name : ("1"), ty : {type : "U1"}})),
    () => jsc.property("addDef", () => _.isEqual(instrP("addAxiom A:*."),{type : "addAxiom", name : ("A"), ty : {type : "U0"}})),
    () => jsc.property("addTactic", () => instrP("addTactic a := a.").type === "addTactic"),
    () => jsc.property("printScript", () => instrP("printScript.").type === "printScript"),
     () => jsc.property("printDef", () => instrP("printDef.").type === "printDef"),
     () => jsc.property("printTacs", () => instrP("printTacs.").type === "printTacs"),
    () => jsc.property("terminate", () => instrP("terminate.").type === "terminate"),
     

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




