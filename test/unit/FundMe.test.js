const { inputToConfig } = require("@ethereum-waffle/compiler");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");

describe("fundMe", async function () {
    let fundMe;
    let deployer;
    let MockV3Aggregator;
    const sendValue = ethers.utils.parseEther("1"); // 1 eth
    beforeEach(async function () {
        // deploy our fundMe contract using Hardhat-deploy
        // so it will deploy the two scirpts we have
        await deployments.fixture(["all"]);

        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
        // whenever we call a function with fundMe, it will automatically be from that 'deployer' account

        MockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        );
    });

    describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
            const response = await fundMe.getPriceFeed();
            assert.equal(response, MockV3Aggregator.address);
        });
    });

    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "Didn't send enough!"
            );
        });
        it("Updates the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.getAddressToAmountFunded(deployer);
            // since we deploy the contract and then send money to it,
            // the address in the list of getgetFunder will be ours
            assert.equal(response.toString(), sendValue.toString());
        });
        it("Adds funder to array of getgetFunder", async function () {
            await fundMe.fund({ value: sendValue });
            const funder = await fundMe.getFunder(0);
            assert.equal(funder, deployer);
        });
    });

    describe("withdraw", function () {
        beforeEach(async () => {
            //before we withdraw, we need the contract to have some money in it
            await fundMe.fund({ value: sendValue });
        });
        it("withdraws ETH from a single funder", async () => {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                // provider - fundMe contract comes with a 'provider'
                // getBalance() is a function of the 'provider' object
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            // These two are objects from the reciept ( transactionResponse ) that we obtain once the transaction is done
            const gasCost = gasUsed.mul(effectiveGasPrice); // gasUsed * effectiveGasPrice

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            );
        });

        it("is allows us to withdraw with multiple getgetFunder", async () => {
            // Arrange
            const accounts = await ethers.getSigners();
            for (let i = 1; i <= 5; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                );
                await fundMeConnectedContract.fund({ value: sendValue });
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const totalGas = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Assert
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(totalGas).toString()
            );

            // Make a getter for storage variables
            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                );
            }

            await expect(fundMe.getFunder(0)).to.be.reverted;
        });

        it("Only allows the owner to withdraw", async () => {
            const accounts = await ethers.getSigners(); // gives a list of accounts
            const attacker = accounts[1];
            const attackerConnectedContract = await fundMe.connect(attacker);
            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWith("FundMe__NotOwner");
        });
    });
});
