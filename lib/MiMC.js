const circomlib = require("circomlibjs");
const buildSponge = circomlib.buildMimcSponge;
const mimcsponge = buildSponge();
const bigInt = require("big-integer");

class MimcSpongeHasher {
  hash(level, left, right) {
    return mimcsponge.multiHash([bigInt(left), bigInt(right)]).toString();
  }
}

module.exports = MimcSpongeHasher;
