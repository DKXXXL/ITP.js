import {CONSOLE} from "./CONSOLE.ITP3"
import {parseToTact, parseToInstr} from "./parser.CONSOLE"

const Fiber = require('fibers');
const repl = require('repl');

const stdoutput = (str) => (process.stdout.write(str), str)
const stderr = (str) => (process.stderr.write(str), str)

const consoleCo = 
    Fiber((s) => CONSOLE(
        {
            i : (pg) => (stdoutput(pg), parseToTact(Fiber.yield())),
            iI :(pg) => (stdoutput(pg), parseToInstr(Fiber.yield())),
            o : stdoutput,
            e : stderr
        }
    }));

consoleCo.run(""); // Initialization.

function delegateConsole(cmd, context, filename, callback){
    consoleCo.run(cmd);
    callback(null, cmd);
}

const replServer = repl.start({ prompt: '> ', eval: myEval });
