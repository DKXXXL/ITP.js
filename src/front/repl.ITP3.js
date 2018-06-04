import {CONSOLE, defaultprintDef, defaultprintScript} from "./console.ITP3"
import {parseToTTact, parseToInstrGen} from "./parser.ITP3"

const Fiber = require('fibers');
const repl = require('repl');

const stdoutput = (str) => (process.stdout.write(str), str)
const stderr = (str) => (process.stderr.write(str), str)

const printDefToIO = defaultprintDef(stdoutput);
const printScriptToIO = defaultprintScript(stdoutput);

let parseToInstr = parseToInstrGen(printDefToIO, printScriptToIO);

const consoleCo = 
    Fiber((s) => CONSOLE(
        {
            i : (pg) => (stdoutput(pg), parseToTTact(Fiber.yield())),
            iI :(pg) => (stdoutput(pg), parseToInstr(Fiber.yield())),
            o : stdoutput,
            e : stderr
        }
    ));

consoleCo.run(""); // Initialization.

function delegateConsole(cmd, context, filename, callback){
    consoleCo.run(cmd);
    callback(null, cmd);
}

const replServer = repl.start({ prompt: '> ', eval: myEval });
