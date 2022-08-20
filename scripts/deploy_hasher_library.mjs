import {createCode, abi} from "./micmsponge_gencontract.mjs";
import { ethers } from "ethers";

import buildMimcSponge from "./micmsponge.mjs";


const SEED = "mimcsponge";

async function main() {
    let mimcJS = await buildMimcSponge();
    let provider = new ethers.getDefaultProvider("http://localhost:8545")
    let account = provider.getSigner(0);
    const C = new ethers.ContractFactory(
        abi,
        createCode(SEED, 220),
        account
      );

    let mimc = await C.deploy();

    // If your contract requires constructor args, you can specify them here
    
    console.log(mimc.address);
    console.log(mimc.deployTransaction);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});