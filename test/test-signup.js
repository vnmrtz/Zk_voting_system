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
  let nullifier = Buffer.from("jeje", "utf-8");
  let secret = Buffer.from("juju", "utf-8");
  const createdDeposit = createDeposit(nullifier, secret);
  const [account, addr1] = await hre.ethers.getSigners();
  console.log(account);
  console.log(createdDeposit);
  const VotationContract = await hre.ethers.getContractAt(
    "Votation",
    "0x998abeb3e57409262ae5b751f60747921b33613e",
    account
  );

  await VotationContract.signUp([
    75, 162, 246, 126, 124, 120, 200, 187, 21, 25, 55, 167, 142, 150, 129, 26,
    59, 210, 201, 72, 216, 38, 88, 117, 204, 210, 229, 190, 243, 93, 117, 30,
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
