import { expect } from "chai";
import { Contract, ContractFactory, Signer, utils } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { hexConcat } from "@ethersproject/bytes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

let Hermes : ContractFactory;
let hermes : Contract;
let ERC20 : ContractFactory;
let token : Contract;
let owner: SignerWithAddress;
let addr1: SignerWithAddress;
let addr2: SignerWithAddress;
let addr3: SignerWithAddress;

describe("Hermes", function () {

  beforeEach(async () => {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    ERC20 = await ethers.getContractFactory("ERC20");
    token = await ERC20.connect(owner).deploy("Doctor", "WHO", 18);
    Hermes = await ethers.getContractFactory("Hermes");
    hermes = await Hermes.connect(owner).deploy(token.address);
  });

  describe("Sell and Trade", () => {
    it("check sell, trade and new currentPrice", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance3 = await token.connect(addr3).approve(hermes.address, parseUnits("100000", 18));
      await allowance3.wait();
      const firstOrder = await hermes.connect(addr3).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      const trade2 = await hermes.connect(addr2).trade(0, {value: parseUnits("6", 17)});
      await trade2.wait();
      const trade1 = await hermes.connect(addr1).trade(0, {value: parseUnits("10", 17)});
      await trade1.wait();
      await ethers.provider.send("evm_increaseTime", [3 * 86400]);
      await ethers.provider.send("evm_mine", []);
      const secondSell = await hermes.connect(owner).newRound();
      await secondSell.wait();
      const sellEth = await hermes.connect(owner).ethToOwner(parseUnits("1", 18));
      await sellEth.wait();
      expect(await hermes.getCurrentPrice()).to.equal(parseUnits("143", 11));
    });

    it("buy more token, than expected with zero address referral", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(ethers.constants.AddressZero);
      await regist2.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy1 = await hermes.connect(addr1).buyToken({value: parseUnits("2", 18)});
      await buy1.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance1 = await token.connect(addr1).approve(hermes.address, parseUnits("100000", 18));
      await allowance1.wait();
      const firstOrder = await hermes.connect(addr1).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      const trade2 = await hermes.connect(addr2).trade(0, {value: parseUnits("1", 18)});
      await trade2.wait();
      expect(await token.balanceOf(addr2.address)).to.equal(parseUnits("1", 23));
    });

    it("Referral's referral has zero address", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr1.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy2 = await hermes.connect(addr2).buyToken({value: parseUnits("2", 18)});
      await buy2.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance2 = await token.connect(addr2).approve(hermes.address, parseUnits("100000", 18));
      await allowance2.wait();
      const firstOrder = await hermes.connect(addr2).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      const trade3 = await hermes.connect(addr3).trade(0, {value: parseUnits("1", 18)});
      await trade3.wait();
      expect(await token.balanceOf(addr3.address)).to.equal(parseUnits("1", 23));
    });

    it("transfer token's ownership", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const backOwner = await hermes.connect(owner).setTokenOwnership(addr1.address);
      await backOwner.wait();
    });

    it("close order", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance3 = await token.connect(addr3).approve(hermes.address, parseUnits("100000", 18));
      await allowance3.wait();
      const firstOrder = await hermes.connect(addr3).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      const trade2 = await hermes.connect(addr2).trade(0, {value: parseUnits("6", 17)});
      await trade2.wait();
      const closeOrder = await hermes.connect(addr3).closeOrder(0);
      await closeOrder.wait();
      expect(await token.balanceOf(addr3.address)).to.equal(parseUnits("40000", 18));
    });
  });

  describe("Check errors", () => {
    it("check new round withour role", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      await expect(hermes.connect(addr1).newRound()).to.be.revertedWith("Person doesnt have the CHAIR_PERSON role");
    });

    it("try early start second sell round", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance3 = await token.connect(addr3).approve(hermes.address, parseUnits("100000", 18));
      await allowance3.wait();
      const firstOrder = await hermes.connect(addr3).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      const trade2 = await hermes.connect(addr2).trade(0, {value: parseUnits("6", 17)});
      await trade2.wait();
      const trade1 = await hermes.connect(addr1).trade(0, {value: parseUnits("10", 17)});
      await trade1.wait();
      await expect(hermes.connect(owner).newRound()).to.be.revertedWith("Previous round isnt over");
    });

    it("try early start trade round", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy1 = await hermes.connect(addr1).buyToken({value: parseUnits("1", 17)});
      await buy1.wait();
      await expect(hermes.connect(owner).newRound()).to.be.revertedWith("Previous round isnt over");
    });

    it("try register twice with one address", async () => {
      await token.deployed();
      await hermes.deployed();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      await expect(hermes.connect(addr1).register(ethers.constants.AddressZero)).to.be.revertedWith("Account already registered");
    });

    it("try register with not registered referr", async () => {
      await token.deployed();
      await hermes.deployed();
      await expect(hermes.connect(addr1).register(addr2.address)).to.be.revertedWith("Referral account not registered");
    });

    it("new Order without enough tokens on balance", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      await ethers.provider.send("evm_increaseTime", [3 * 86400]);
      await ethers.provider.send("evm_mine", []);
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      await expect(hermes.connect(addr1).newOrder(parseUnits("100000", 18))).to.be.reverted;
    });

    it("new Order without allowance", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy1 = await hermes.connect(addr1).buyToken({value: parseUnits("1", 18)});
      await buy1.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      await expect(hermes.connect(addr1).newOrder(parseUnits("100000", 18))).to.be.reverted;
    });

    it("transfer token's ownership without admin role", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      await expect(hermes.connect(addr1).setTokenOwnership(addr1.address)).to.be.revertedWith("Person doesnt have the DEFAULT_ADMIN_ROLE role");
    });

    it("transfer eth without admin role", async () => {
      await token.deployed();
      await hermes.deployed();
      await expect(hermes.connect(addr1).ethToOwner(parseUnits("1", 18))).to.be.revertedWith("Person doesnt have the DEFAULT_ADMIN_ROLE role");
    });

    it("transfer more eth, than have", async () => {
      await token.deployed();
      await hermes.deployed();
      await expect(hermes.connect(owner).ethToOwner(parseUnits("1", 18))).to.be.revertedWith("Contract doesn't have enough eth");
    });

    it("trade with closed order", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance3 = await token.connect(addr3).approve(hermes.address, parseUnits("100000", 18));
      await allowance3.wait();
      const firstOrder = await hermes.connect(addr3).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      const trade2 = await hermes.connect(addr2).trade(0, {value: parseUnits("2", 18)});
      await trade2.wait();
      await expect(hermes.connect(addr1).trade(0, {value: parseUnits("1", 18)})).to.be.revertedWith("Order is closed");
    });

    it("trade with zero eth", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance3 = await token.connect(addr3).approve(hermes.address, parseUnits("100000", 18));
      await allowance3.wait();
      const firstOrder = await hermes.connect(addr3).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      await expect(hermes.connect(addr1).trade(0, {value: parseUnits("0", 18)})).to.be.revertedWith("Value is zero wei");
    });

    it("buy token when sell round closed", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      await expect(hermes.connect(addr1).buyToken({value: parseUnits("1", 18)})).to.be.revertedWith("Sell round is over");
    });

    it("buy token with zero wei", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      await expect(hermes.connect(addr3).buyToken({value: parseUnits("0", 18)})).to.be.revertedWith("Value is zero wei");
    });

    it("buy token in trade round", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      await expect(hermes.connect(addr1).buyToken({value: parseUnits("1", 18)})).to.be.revertedWith("Sell round has not come yet");
    });

    it("buy token with not registered account", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist3 = await hermes.connect(addr3).register(addr1.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 17)});
      await buy3.wait();
      await expect(hermes.connect(addr2).buyToken({value: parseUnits("1", 18)})).to.be.revertedWith("Account not registered");
    });

    it("trade in sell round", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 17)});
      await buy3.wait();
      await expect(hermes.connect(addr3).newOrder(parseUnits("100000", 18))).to.be.revertedWith("Trade round has not come yet");
    });

    it("trade with not registered account", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist3 = await hermes.connect(addr3).register(addr1.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      await expect(hermes.connect(addr2).newOrder(parseUnits("100000", 18))).to.be.revertedWith("Account not registered");
    });

    it("close not users order", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance3 = await token.connect(addr3).approve(hermes.address, parseUnits("100000", 18));
      await allowance3.wait();
      const firstOrder = await hermes.connect(addr3).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      const trade2 = await hermes.connect(addr2).trade(0, {value: parseUnits("6", 17)});
      await trade2.wait();
      await expect(hermes.connect(addr1).closeOrder(0)).to.be.revertedWith("User doesnt own this order");
    });

    it("close order when status of order close", async () => {
      await token.deployed();
      await hermes.deployed();
      const transferOwner = await token.connect(owner).transferOwnership(hermes.address);
      await transferOwner.wait();
      const regist1 = await hermes.connect(addr1).register(ethers.constants.AddressZero);
      await regist1.wait();
      const regist2 = await hermes.connect(addr2).register(addr1.address);
      await regist2.wait();
      const regist3 = await hermes.connect(addr3).register(addr2.address);
      await regist3.wait();
      const firstSell = await hermes.connect(owner).newRound();
      await firstSell.wait();
      const buy3 = await hermes.connect(addr3).buyToken({value: parseUnits("1", 18)});
      await buy3.wait();
      const firstTrade = await hermes.connect(owner).newRound();
      await firstTrade.wait();
      const allowance3 = await token.connect(addr3).approve(hermes.address, parseUnits("100000", 18));
      await allowance3.wait();
      const firstOrder = await hermes.connect(addr3).newOrder(parseUnits("100000", 18));
      await firstOrder.wait();
      const trade2 = await hermes.connect(addr2).trade(0, {value: parseUnits("10", 17)});
      await trade2.wait();
      await expect(hermes.connect(addr3).closeOrder(0)).to.be.revertedWith("Order is closed");
    });
  });

});
