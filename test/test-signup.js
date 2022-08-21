/** Compute pedersen hash */
const circomlib = require("circomlibjs");
const hre = require("hardhat");

let babyJub;
let pedersenAlg;
let pedersenHash;

function createDeposit(nullifier, secret) {
  let deposit = { nullifier, secret };
  deposit.preimage = Buffer.concat([deposit.nullifier, deposit.secret]);
  deposit.commitment = pedersenHash(deposit.preimage);
  deposit.nullifierHash = pedersenHash(deposit.nullifier);
  return deposit;
}

async function main() {
  babyJub = await circomlib.buildBabyjub();
  pedersenAlg = await circomlib.buildPedersenHash();
  pedersenHash = (data) => babyJub.unpackPoint(pedersenAlg.hash(data))[0];
  let nullifier = Buffer.from("ae", "utf-8");
  let secret = Buffer.from("j", "utf-8");
  const createdDeposit = createDeposit(nullifier, secret);
  const [account, addr1] = await hre.ethers.getSigners();
  console.log(account);
  console.log(createdDeposit);
  const VotationContract = await hre.ethers.getContractAt(
    "Votation",
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    account
  );
  console.log(Array.from(createdDeposit.commitment.values()))
  let index = await VotationContract.signUp(Array.from(createdDeposit.commitment.values()));
  console.log(index);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
