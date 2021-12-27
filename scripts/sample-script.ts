const hre = require("hardhat");

async function main() {
  
  const Hermes = await hre.ethers.getContractFactory("Hermes");
  const hermes = await Hermes.deploy(process.env.TOKEN_ADDR);

  await hermes.deployed();

  console.log("Hermes deployed to:", hermes.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
