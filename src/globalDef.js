//@flow

export type ID = string;
export type UDEF = typeof undefined;
const ideq = (x : ID, y : ID) => x === y;
const ppID = (x: ID) :string => x; 

class Cont<I, J>{
    constructor(f: (I, J => UDEF) => UDEF) {
        this.f = f;
    }
    <K>resume(next: Cont<J, K>):Cont<I, K>{
        return new Cont(
            (i: I, k: K=> UDEF) => next.f(i, j => next.f(j, k))
        );
    }
    <K>res(next: (J, K => UDEF) => UDEF){
        return this.resume(new Cont(next));
    }
}



function myEval(cmd, context, filename, callback) {
  
}




module.exports = {ideq, ppID};