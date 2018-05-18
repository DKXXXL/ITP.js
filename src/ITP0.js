//@flow

// UTLC

type term = 
     {type : "bool", bval : boolean} 
    | {type : "abs", v: number, body : term} 
    | {type : "beq", t1 : term, t2 : term}
    | {type : "var", t : number}
    | {type : "app", t1 : term, t2 : term}

let subst = (exp : term, from : number, to : term) : term => {
    let sb = (subexp : term) : term => subst(subexp, from, to);
    if(exp.type === "abs" && exp.v !== from) {
        return {type: "abs", v : exp.v, body : sb(exp.body)};
    } else if (exp.type === "beq") {
        return {type : "beq", t1: sb(exp.t1), t2: sb(exp.t2)};
    } else if (exp.type === "app") {
        return {type : "app", t1: sb(exp.t1), t2: sb(exp.t2)};
    } else if (exp.type === "var" && exp.t === from) {
        return to;
    } else {
        throw "Stuck!"
    }
}


let interp = (exp : term) : term => {
  if(exp.type === "bool" || exp.type === "abs") {
      return exp;
  }  else if(exp.type === "app") {
      let abs : term = exp.t1;
      if(abs.type === "abs") {          
          return subst(abs.body, abs.v, exp.t2);
      } else {
          throw "Stuck!"
      }
     
  } else if (exp.type === "beq") {
      let t1 = exp.t1;
      let t2 = exp.t2;
      if(t1.type !== "bool") {
          throw "Stuck";
      }
      if(t2.type !== "bool") {
          throw "Stuck";
      }
      return {type : "bool", bval : t1.bval == t2.bval};
  } else {
      throw "Stuck";
  }
    
};


