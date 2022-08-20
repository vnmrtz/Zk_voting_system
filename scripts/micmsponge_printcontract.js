import {createCode} from "./micmsponge_gencontract.js";

const SEED = "mimc";

let nRounds;
if (typeof process.argv[2] != "undefined") {
    nRounds = parseInt(process.argv[2]);
} else {
    nRounds = 91;
}

console.log(createCode(SEED, nRounds));