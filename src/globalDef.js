//@flow

export type ID = string;
export type UDEF = typeof undefined;
const ideq = (x : ID, y : ID) => x === y;
const ppID = (x: ID) :string => x; 


module.exports = {ideq, ppID};