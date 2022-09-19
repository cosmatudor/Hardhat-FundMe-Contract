// When we run hh deploy, it will call a function that we specifie in this script
// We are gonna export that function as the default function for hh deploy to look for

const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

// hre -> hardhat runtime envivorment
//     -> basically the samte thing with hardhat
//     -> we pass the hardhat object as a parametre to this function

// async function deployFunc(hre) {
//      ...
// }
// module.exports.default = deployFunc

// OR

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre;

    const { deploy, log, get } = deployments; // deploy and log are functions
    const { deployer } = await getNamedAccounts(); // <- a way to get named accounts; deployer is an account
    const chainID = network.config.chainID;

    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainID]["ethUsdPriceFeed"];
    }

    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (!developmentChains.includes(network.name)) {
        await verify(fundMe.address, args);
    }

    log("------------------------------------------");
};

module.exports.tags = ["all", "fundme"];

// When going for localhost or hardhat network we want to use a mock
// In our case, to replicate the price feed contract when deploying localy
