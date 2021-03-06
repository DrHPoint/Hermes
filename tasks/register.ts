import { task } from "hardhat/config";
//import { parseUnits } from "ethers/lib/utils";
//import { ethers } from "hardhat";
//import { hexConcat } from "@ethersproject/bytes";

task("register", "Register new account")
.addParam("referr", "Referr's address")
.setAction(async (taskArgs, hre) => {
  const [addr1, addr2, ...addrs] = await hre.ethers.getSigners();

  //const token = await hre.ethers.getContractAt("MyToken", process.env.TOKEN_ADDR as string);
  const hermes = await hre.ethers.getContractAt("Hermes", process.env.HERMES_ADDR as string);
  await hermes.connect(addr2).register(taskArgs.referr as string);

  console.log('register task Done!'); 
});

//"0x0000000000000000000000000000000000000000"