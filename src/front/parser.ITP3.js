import {toID, debug, warn} from "../globalDef"
const ParserC = require("parsimmon");

const optWS = ParserC.optWhitespace;
const WS = ParserC.whitespace;

const foldToApp = (xs) => xs.reduce(((f, x) => ({type : "apply", fun : f, arg: x})));
const foldToSeq = (xs) => xs.reduce(((f, x) => ({type : "seq", t0 : f, t1: x})), {type: "cmds", t : {type : "idtac"}});

const numberChar = "1234567890";
const NumberParser = ParserC.regexp(/[0-9]+/);
const smallabt = "qwertyuiopasdfghjklzxcvbnm";
const abt = smallabt + smallabt.toUpperCase();
const symbolChar = "!@#$%^&-_+=";




const langTerm = ParserC.createLanguage(
    {
        Value : (self) => ParserC.alt(self. U1, self. U0, self.Lambda, self.Pi, self.App, self.Variable),
        U1 : () => ParserC.string("**").wrap(optWS, optWS).result({type: "U1"}),
        U0 : () => ParserC.string("*").wrap(optWS, optWS).result({type: "U0"}),
        Lambda : (r) => 
            ParserC.seqMap(
                ParserC.string("\\\\").then(optWS).then(r.Variable).skip(optWS).skip(ParserC.string(":")),
                optWS.then(r.Value).skip(optWS).skip(ParserC.string(",")),
                optWS.then(r.Value),
                (metaid, declty, body) => ({type: "lambda", bind : metaid.n, iT : declty, body : body})
            ),
        Pi : (r) => 
            ParserC.seqMap(
                ParserC.string("forall").then(WS).then(r.Variable).skip(optWS).skip(ParserC.string(":")),
                optWS.then(r.Value).skip(optWS).skip(ParserC.string(",")),
                optWS.then(r.Value),
                (metaid, declty, body) =>( {type: "pi", bind : metaid.n, iT : declty, body : body})
            ),
        App : (r) => r.Value.sepBy1(WS).wrap(optWS, optWS).wrap(ParserC.string("("), ParserC.string(")")).map(
                                        xs => {
                                            if(xs.length === 1) {
                                                return xs[0];
                                            } else {
                                                // xs.length > 1
                                                return foldToApp(xs);
                                            }
                                        } ),
        Variable : () => ParserC.oneOf(numberChar + abt + symbolChar).atLeast(1).map(xs => xs.reduce((x,y) => x + y)).map(x => ({type:"var", n : toID(x)}))               
    }
)

const langCommand = ParserC.createLanguage(
    {
        Cmd : (r) => ParserC.alt(r.intro, r.apply, r.check, r.conv, r.letTerm, r.idtac),
        intro : () => ParserC.string("intro").result({type : "intro"}),
        apply : () => ParserC.seqMap(
                (ParserC.string("apply")),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, ParserC.string("")).times(2),
                (icon, xs) => ({type : "apply", caller : xs[0], callee : xs[1]})
            ),
        check : () => ParserC.seqMap(
                (ParserC.string("check")),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, ParserC.string("")).times(1),
                (icon, xs) => ({type : "check", term : xs[0]})
            ),
        conv : () => ParserC.seqMap(
                (ParserC.string("conv")),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, ParserC.string("")).times(1),
                (icon, xs) =>( {type : "conv", term : xs[0]})
            ),        
        letTerm : () => ParserC.seqMap(
                (ParserC.string("let")).skip(WS),
                langTerm.Variable.wrap(optWS, WS).skip(ParserC.string(":=").skip(optWS)),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, ParserC.string("")).times(1),
                (icon, vname, vbinding) => ({type : "let", bind : vname.n, term : vbinding[0]})

        ),
        idtac : () => ParserC.string("idtac").result({type: "idtac"})
    }
);

const langTactic = ParserC.createLanguage(
    {
        tacs: (r) => ParserC.alt(r.cmds,r.seq, r.lettac, r.metavar),
        cmds : () => langCommand.Cmd.wrap(optWS, optWS).map(x =>( {type : "cmds", t : x})),
        seq : (r) => r.tacs.sepBy1(ParserC.string(";").wrap(optWS, optWS))
                            .wrap(ParserC.string("["), ParserC.string("]"))
                            .wrap(optWS, optWS)
                            .map(xs => (foldToSeq(xs))),
        lettac : (r) => ParserC.seqMap(
            optWS.then(ParserC.string("lettac")).then(r.metavar.wrap(WS, optWS)).skip(ParserC.string(":=").wrap(optWS, optWS)),
            r.tacs.wrap(ParserC.string("[").wrap(optWS, optWS), ParserC.string("]").wrap(optWS, optWS)).skip(ParserC.string("in").wrap(optWS,WS)),
            r.tacs.wrap(optWS, optWS),
            (bind, binding, body) => ({type : "let", name : bind.n, bind : binding, body : body})
        ),
        metavar : () => ParserC.seqMap( 
            ParserC.oneOf(abt),
            ParserC.oneOf(numberChar + abt + symbolChar).atLeast(0).map(xs => xs.reduce((x,y) => x + y, "")),
            (head, tail) => ({type : "metavar", n : head + tail})
        )
    }
)


const langTTactic = ParserC.createLanguage({
        all : (r) => ParserC.alt(langTactic.tacs.map(x => [[0, x]]),
                                 r.ttactic)
                                 .skip(ParserC.string(".").wrap(optWS, optWS)),
        ttactic: () => 
                ParserC.seqMap(
                    NumberParser.wrap(optWS, optWS).skip(ParserC.string(":")),
                    langTactic.tacs.wrap(optWS, optWS),
                    (target, tactic) => [Number(target), tactic]
                ).sepBy1(ParserC.string("|").wrap(optWS, optWS)).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS)
})

const langInstruction = ParserC.createLanguage({
    all: (r) => ParserC.alt(r.addDef, r.addAxiom, r.addTactic, r.printScript, r.printDef, r.printTacs, r.terminate)
                        .skip(ParserC.string(".").wrap(optWS, optWS)),
    addDef : () => ParserC.seqMap(
                optWS.skip(ParserC.string("addDef").wrap(optWS, WS)).then(langTerm.Variable.wrap(optWS,optWS)).skip(ParserC.string(":").wrap(optWS, optWS)),
                langTerm.Value.wrap(optWS, optWS),
                (name, binding) => ({type : "addDef", name : name.n, ty : binding})
            ),
    addAxiom : () => ParserC.seqMap(
                optWS.skip(ParserC.string("addAxiom").wrap(optWS, WS)).then(langTerm.Variable.wrap(optWS,optWS)).skip(ParserC.string(":").wrap(optWS, optWS)),
                langTerm.Value.wrap(optWS, optWS),
                (name, binding) => ({type : "addAxiom", name : name.n, ty : binding})
            ),
    addTactic : () => ParserC.seqMap(
                optWS.skip(ParserC.string("addTactic").wrap(optWS, WS)).then(langTactic.metavar.wrap(optWS,optWS)).skip(ParserC.string(":=").wrap(optWS, optWS)),
                langTactic.tacs.wrap(optWS, optWS),
                (name, binding) =>( {type : "addTactic", name : name.n, ty : binding})
            ),
    printScript : () => ParserC.string("printScript").wrap(optWS,optWS).result({type : "printScript"}),
    printDef : () => ParserC.string("printDef").wrap(optWS,optWS).result({type : "printDef"}),
    printTacs : () => ParserC.string("printTacs").wrap(optWS,optWS).result({type : "printTacs"}),
    terminate : () => ParserC.string("terminate").wrap(optWS,optWS).result({type : "terminate"})
})

const parseToTTact = (src) => {
        let ret = undefined;
        while(true) {
            try{
                
                ret = langTTactic.all.tryParse(src());
            } catch(err) {
                warn("Parsing TTactic failed");
                warn(JSON.stringify(err));
                continue;
            }
            debug("Parsing TTactic success");
            return ret;
        }
    }
const parseToInstr =  (src) => {
        let ret = undefined;
        while(true) {
            try{
                ret = langInstruction.all.tryParse(src());
            } catch(err) {
                warn("Parsing Instruction failed");
                warn(JSON.stringify(err));
                continue;
            }
            debug("Parsing Instruction Success");
            
            return ret;
        }
    }


module.exports = {
    parseToTTact,
    parseToInstr,
    langTerm, langCommand, langTactic, langTTactic, langInstruction
};


