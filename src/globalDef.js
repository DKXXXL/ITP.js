//@flow

export type ID = string;
export type UDEF = typeof undefined;
export type Actic = PartialGoals => Commands;
export type Generator<X> = () => Option<X> ;
const ideq = (x : ID, y : ID) => x === y;
const ppID = (x: ID) :string => x; 


module.exports = {ideq, ppID};