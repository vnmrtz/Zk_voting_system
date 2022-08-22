import { createCode, abi } from "./micmsponge_gencontract.mjs";
import hre from "hardhat";

import buildMimcSponge from "./micmsponge.mjs";

const SEED = "mimcsponge";

async function main() {
  //####### Deploy hasher librabry ######
  await buildMimcSponge();
  let provider = hre.ethers.getDefaultProvider("http://localhost:8545");
  const [account, addr1] = await hre.ethers.getSigners();
  console.log(account);
  const C = new hre.ethers.ContractFactory(abi, createCode(SEED, 220), account);
  let mimc = await C.deploy();
  console.log(`Hasher library was deployed to ${mimc.address}`);
  console.log(
    await mimc.MiMCSponge(
      "11111111111111111111111111111111111111111111111111111111111111111111111111111",
      "11111111111111111111111111111111111111111111111111111111111111111111111111111",
      0
    )
  );

  //####### Deploy verifier contract ######
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();

  console.log(`Verifier contract deployed to ${verifier.address}`);

  const VotingFactory = await hre.ethers.getContractFactory("VotingFactory");   
  const votingFactory = await upgrades.deployProxy(VotingFactory, [verifier.address, mimc.address], {
    initializer: "initialize",
  }); 

  console.log("VotingFactory deployed to:", votingFactory.address);



  /* //####### Deploy Votation Contract #######
  const Votation = await hre.ethers.getContractFactory("Votation");
  const votationContract = await Votation.deploy(
    1,
    "test",
    "votacion",
    ["1", "2", "3"],
    [account.address],
    "1661094553",
    "1661126553",
    account.address,
    verifier.address,
    mimc.address,
    {
      gasLimit: 30000000,
    }
  );
  console.log(`Votation Contract was deployed to ${votationContract.address}`); */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
