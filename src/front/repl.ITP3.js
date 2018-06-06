import {CONSOLE, defaultprintDef, defaultprintScript} from "./console.ITP3"
import {parseToTTact, parseToInstrGen} from "./parser.ITP3"
import {debug} from "../globalDef"

const Fiber = require('fibers');
const repl = require('repl');

let INPUTSCRIPT = "";

const stdoutput = (str) => (process.stdout.write(str + "\n"), str)
const stderr = (str) => (process.stderr.write(str + "\n"), str)

const printDefToIO = defaultprintDef(stdoutput);
const printScriptToIO = defaultprintScript(stdoutput);

let parseToInstr = parseToInstrGen(printDefToIO, printScriptToIO);

const scriptGet = () => INPUTSCRIPT;

const fiberY = () => {
    const ret = Fiber.yield();
    INPUTSCRIPT = INPUTSCRIPT + ret;
    return ret;
}

const consoleCo = 
    Fiber((s) => CONSOLE(
        {
            i : (pg) => (stdoutput(pg), parseToTTact(fiberY)),
            iI :(pg) => (stdoutput(pg), parseToInstr(fiberY)),
            o : stdoutput,
            e : stderr,
            scripts : scriptGet,
        }
    ));

consoleCo.run(""); // Initialization.

function delegateConsole(cmd, context, filename, callback){
    debug("newcmd");
    consoleCo.run(cmd);

    callback(null, cmd);
}

const replServer = repl.start({ prompt: '> ', eval: delegateConsole });

