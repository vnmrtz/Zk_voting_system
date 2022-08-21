/** Compute pedersen hash */
const circomlib = require("circomlibjs");
const hre = require("hardhat");
const fs = require("fs");
const assert = require("assert");
const snarkjs = require("snarkjs");
const circomlib = require("circomlib");
const bigInt = snarkjs.bigInt;
const merkleTree = require("../lib/MerkleTree");
const readline = require("readline-sync");
const buildGroth16 = require("websnark/src/groth16");
const websnarkUtils = require("websnark/src/utils");
const MERKLE_TREE_HEIGHT = 15;

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
  console.log(Array.from(createdDeposit.commitment.values()));
  let index = await VotationContract.signUp(
    Array.from(createdDeposit.commitment.values())
  );
  console.log(index);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function generateMerkleProof(contract, deposit) {
  // Get all deposit events from smart contract and assemble merkle tree from them
  console.log("Getting current state from tornado contract");
  const events = await contract.getPastEvents("SignUp", {
    fromBlock: contract.deployedBlock,
    toBlock: "latest",
  });
  const leaves = events
    .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex) // Sort events in chronological order
    .map((e) => e.returnValues.commitment);
  const tree = new merkleTree(MERKLE_TREE_HEIGHT, leaves);

  // Find current commitment in the tree
  let depositEvent = events.find(
    (e) => e.returnValues.commitment === toHex(deposit.commitment)
  );
  let leafIndex = depositEvent ? depositEvent.returnValues.leafIndex : -1;

  // Validate that our data is correct
  const isValidRoot = await contract.methods
    .isKnownRoot(toHex(await tree.root()))
    .call();
  assert(isValidRoot === true, "Merkle tree is corrupted");
  assert(leafIndex >= 0, "The deposit is not found in the tree");

  // Compute merkle proof of our commitment
  return await tree.path(leafIndex);
}

/**
 * Generate SNARK proof for withdrawal
 * @param contract Tornado contract address
 * @param note Note string
 * @param recipient Funds recipient
 * @param relayer Relayer address
 * @param fee Relayer fee
 * @param refund Receive ether for exchanged tokens
 */
async function generateProof(
  contract,
  deposit,
  recipient,
  relayer = 0,
  fee = 0,
  refund = 0
) {
  // Decode hex string and restore the deposit object
  // let buf = Buffer.from(note.slice(2), 'hex')
  // let deposit = createDeposit(bigInt.leBuff2int(buf.slice(0, 31)), bigInt.leBuff2int(buf.slice(31, 62)))

  // Compute merkle proof of our commitment
  const { root, path_elements, path_index } = await generateMerkleProof(
    contract,
    deposit
  );

  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: bigInt(recipient),
    relayer: bigInt(relayer),
    fee: bigInt(fee),
    refund: bigInt(refund),

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: path_elements,
    pathIndices: path_index,
  };

  console.log("Generating SNARK proof");
  console.time("Proof time");
  const proofData = await websnarkUtils.genWitnessAndProve(
    groth16,
    input,
    circuit,
    proving_key
  );
  const { proof } = websnarkUtils.toSolidityInput(proofData);
  console.timeEnd("Proof time");

  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund),
  ];

  return { proof, args };
}
