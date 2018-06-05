import {toID, debug} from "../globalDef"
const ParserC = require("parsimmon");

const optWS = ParserC.optWhitespace;
const WS = ParserC.whitespace;

const foldToApp = (xs) => xs.reduce(((f, x) => ({type : "apply", fun : f, arg: x})));
const foldToSeq = (xs) => xs.reduce(((f, x) => ({type : "seq", t0 : f, t1: x})));

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
                optWS.then(ParserC.string("apply")).skip(optWS),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).times(2),
                (icon, xs) => ({type : "apply", caller : xs[0], callee : xs[1]})
            ),
        check : () => ParserC.seqMap(
                optWS.then(ParserC.string("check")).skip(optWS),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).times(1),
                (icon, xs) => ({type : "check", term : xs[0]})
            ),
        conv : () => ParserC.seqMap(
                optWS.then(ParserC.string("conv")).skip(optWS),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).times(1),
                (icon, xs) =>( {type : "conv", term : xs[0]})
            ),        
        letTerm : () => ParserC.seqMap(
                optWS.then(ParserC.string("let")).skip(WS),
                langTerm.Variable.wrap(optWS, WS).skip(ParserC.string(":=").skip(optWS)),
                langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).times(1),
                (icon, vname, vbinding) => ({type : "let", bind : toID(vname), term : vbinding[0]})

        ),
        idtac : () => ParserC.string("idtac").wrap(optWS, optWS).result({type: "idtac"})
    }
);

const langTactic = ParserC.createLanguage(
    {
        tacs: (r) => ParserC.alt(r.seq,r.cmds, r.lettac, r.metavar),
        cmds : () => langCommand.Cmd.wrap(optWS, optWS).map(x =>( {type : "cmds", t : x})),
        seq : (r) => r.tacs.sepBy1(ParserC.string(";").wrap(optWS, optWS))
                            .wrap(ParserC.string("["), ParserC.string("]"))
                            .wrap(optWS, optWS)
                            .map(x => x + [{type : "cmds", t : {type : "idtac"}}])
                            .map(xs => foldToSeq(xs)),
        lettac : (r) => ParserC.seqMap(
            optWS.then(ParserC.string("lettac")).then(r.metavar.wrap(WS, optWS)).skip(ParserC.string(":=").wrap(optWS, optWS)),
            r.tacs.skip(ParserC.string("in").wrap(WS,WS)),
            r.tacs,
            (bind, binding, body) => ({type : "let", name : bind.n, bind : binding, body : body})
        ),
        metavar : () => ParserC.seqMap( 
            ParserC.oneOf(abt),
            ParserC.oneOf(numberChar + abt + symbolChar).atLeast(1).map(xs => xs.reduce((x,y) => x + y)),
            (head, tail) => ({type : "metavar", n : head + tail})
        )
    }
)


const langTTactic = ParserC.createLanguage({
        all : (r) => ParserC.alt(r.ttactic,
                                 langTactic.tacs.map(x => [[0, x]]))
                                 .skip(ParserC.string(".").wrap(optWS, optWS)),
        ttactic: () => 
                ParserC.seqMap(
                    NumberParser.wrap(optWS, optWS).skip(ParserC.string(":")),
                    langTactic.tacs.wrap(optWS, optWS),
                    (target, tactic) => [Number(target), tactic]
                ).sepBy1(ParserC.string("|")).wrap(ParserC.string("["), ParserC.string(")"))
})

const langInstructionGen = (defaultprintDef, defaultprintScript) => ParserC.createLanguage({
    all: (r) => ParserC.alt(r.addDef, r.addTactic, r.printScript, r.printDef, r.printTacs, r.terminate)
                        .skip(ParserC.string(".").wrap(optWS, optWS)),
    addDef : () => ParserC.seqMap(
                optWS.skip(ParserC.string("addDef")).then(langTerm.Variable.wrap(WS,WS)),
                langTerm.Value.wrap(optWS, optWS),
                (name, binding) => ({type : "addDef", name : name.n, ty : binding})
            ),
    addTactic : () => ParserC.seqMap(
                optWS.skip(ParserC.string("addTactic")).then(langTerm.Variable.wrap(WS,WS)),
                langTactic.tacs.wrap(optWS, optWS),
                (name, binding) =>( {type : "addTactic", name : name.n, ty : binding})
            ),
    printScript : () => ParserC.string("printScript").wrap(optWS).result({type : "printScript", outMethod : defaultprintScript}),
    printDef : () => ParserC.string("printDef").wrap(optWS).result({type : "printDef", outMethod : defaultprintDef}),
    printTacs : () => ParserC.string("printTacs").wrap(optWS).result({type : "printTacs"}),
    terminate : () => ParserC.string("terminate").wrap(optWS).result({type : "terminate"})
})

const parseToTTact = (src) => {
        let ret = undefined;
        while(true) {
            try{
                
                ret = langTTactic.all.tryParse(src());
            } catch(err) {
                debug("Parsing TTactic failed");
                debug(JSON.stringify(err));
                continue;
            }
            debug("Parsing TTactic success");
            return ret;
        }
    }
const parseToInstrGen = (pdef, pscript) => {
        const langInstr = langInstructionGen(pdef, pscript);
        return (src) => {
        let ret = undefined;
        while(true) {
            try{
                ret = langInstr.all.tryParse(src());
            } catch(err) {
                debug("Parsing Instruction failed");
                continue;
            }
            debug("Parsing Instruction Success");
            debug(JSON.stringify(err));
            return ret;
        }
    }
}

module.exports = {
    parseToTTact,
    parseToInstrGen,
    langTerm, langCommand, langTactic, langTTactic, langInstructionGen
};


