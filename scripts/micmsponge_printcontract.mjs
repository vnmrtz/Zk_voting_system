import {createCode} from "./micmsponge_gencontract.mjs";

const SEED = "mimc";

let nRounds;
if (typeof process.argv[2] != "undefined") {
    nRounds = parseInt(process.argv[2]);
} else {
    nRounds = 220;
}

console.log(createCode(SEED, nRounds));