import { task } from "hardhat/config";
import { parseUnits } from "ethers/lib/utils";
//import { ethers } from "hardhat";
//import { hexConcat } from "@ethersproject/bytes";

task("neworder", "Create new order")
.addParam("value", "token's value order")
.setAction(async (taskArgs, hre) => {
  const [addr1, addr2, ...addrs] = await hre.ethers.getSigners();

  const token = await hre.ethers.getContractAt("ERC20", process.env.TOKEN_ADDR as string);
  const hermes = await hre.ethers.getContractAt("Hermes", process.env.HERMES_ADDR as string);
  const decimals = await token.decimals();
  await token.connect(addr2).approve(process.env.HERMES_ADDR as string, parseUnits(taskArgs.value, decimals));
  await hermes.connect(addr2).newOrder(parseUnits(taskArgs.value, decimals));

  console.log('neworder task Done!'); 
});