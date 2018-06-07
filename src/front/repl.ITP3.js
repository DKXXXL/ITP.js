import {CONSOLE, defaultprintDef, defaultprintScript} from "./console.ITP3"
import {parseToTTact, parseToInstr} from "./parser.ITP3"
import {debug, warn} from "../globalDef"

const Fiber = require('fibers');

let INPUTSCRIPT = "";

const scriptGet = () => INPUTSCRIPT;

const fiberY = () => {
    const ret = Fiber.yield();
    INPUTSCRIPT = INPUTSCRIPT + ret;
    return ret;
}

const consoleCons = (stdoutput, stderr) => 
    Fiber((s) => CONSOLE(
        {
            i : (pg) => (stdoutput(pg), parseToTTact(fiberY)),
            iI :(pg) => (stdoutput(pg), parseToInstr(fiberY)),
            o : stdoutput,
            e : stderr,
            scripts : scriptGet,
        }
    ));

module.exports = { consoleCons };

