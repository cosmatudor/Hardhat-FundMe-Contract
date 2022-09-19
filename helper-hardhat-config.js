const networkConfig = {
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
};

const developmentChains = ["hardhat", "localhost"];
const DECIMALS = 8; // ???
const INITIAL_ANSWER = 200000000000; // ???

module.exports = {
    networkConfig,
    /*
        doing this, we can export just the networkConfig 
        const {networkConfig} = require("./helper-hardhat-config");

        INSTEAD OF THIS
        const helperConfig = require(""./helper-hardhat-config");
        const networkConfig = helperConfig.networkConfig;
    */

    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
};
