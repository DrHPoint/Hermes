import { task } from "hardhat/config";
//import { parseUnits } from "ethers/lib/utils";
//import { ethers } from "hardhat";
//import { hexConcat } from "@ethersproject/bytes";

task("transfertokenownershipback", "Transfer Ownership of token contract to some address")
.addParam("newowner", "New owner's address")
.setAction(async (taskArgs, hre) => {
  const [addr1, addr2, ...addrs] = await hre.ethers.getSigners();

  //const token = await hre.ethers.getContractAt("MyToken", process.env.TOKEN_ADDR as string);
  const hermes = await hre.ethers.getContractAt("Hermes", process.env.HERMES_ADDR as string);
  await hermes.setTokenOwnership(taskArgs.newowner as string);

  console.log('transfertokenownershipback task Done!'); 
});