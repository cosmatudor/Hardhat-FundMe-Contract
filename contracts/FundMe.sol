// SPDX-License-Identifier: MIT

// Pragma
pragma solidity ^0.8.0;

// Imports
import "./PriceConverter.sol";

// Error Codes
error FundMe__NotOwner();

// Interfaces, Libraries , Contracts

contract FundMe {
    using PriceConverter for uint256; // library for uint256

    uint256 public number;
    uint256 public constant MINIMUM_USD = 50 * 10**18; // keyword "constant" cuz it's not changing its value

    address[] private funders;
    mapping(address => uint256) private addressToAmountFunded;

    address private immutable i_owner;
    // constant and immutable keywords are used for saving gas

    AggregatorV3Interface private priceFeed; //an interface that compiled down gives an ABI

    //'constructor' a function that it's runned as soon as someone deploy the contract
    constructor(address priceFeedAddress) {
        // now, in this priceFeedAddress, we store the address of the chain that we're on
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress); // ABI(address) = contract
    }

    function fund() public payable {
        number = 5;
        //if the condition ins't true, this message will be printed
        //AND all the actions that happend in the function will be reverted

        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
            "Didn't send enough!"
        );
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        funders = new address[](0); // <-how to reset an array to blank

        /*
        // How to actually withdraw the funds:
        
        //transfer -> automatically revertes if it exceedes 2300 gas
        payable(msg.sender).transfer(address(this).balance); 

        // send -> send a boolean whether txn exceeds 2300 or not, but it's not revertable
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "Send failed!");
        */

        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed!");
    }

    modifier onlyOwner() {
        //creates a keyword that can be added to any function in order to do smth that we want
        //require(msg.sender == i_owner, "Sender is not owner!");
        // OR (a more efficient way to save gas)
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _; // <- that symbolise the rest of the code
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return priceFeed;
    }
}
