//@flow

export type ID = string;
const ideq = (x : ID, y : ID) => x === y;
const ppID = (x: ID) :string => x; 

module.exports = {ideq, ppID};