import hre from "hardhat";

const PROXY = "0x7b14ce066B27F1989f94f790bcd636597fc0F49E";

async function main() {
    //####### Deploy hasher librabry ######
    const VotingFactoryV2 = await hre.ethers.getContractFactory("VotingFactory");
    console.log("Upgrading VotingFactory...");
    await upgrades.upgradeProxy(PROXY, VotingFactoryV2);
    console.log("VotingFactory upgraded successfully");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
