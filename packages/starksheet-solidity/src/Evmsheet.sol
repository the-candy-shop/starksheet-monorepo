// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "openzeppelin/access/Ownable.sol";
import "./Sheet.sol";

error SheetPriceError(uint256 price);

contract Evmsheet is Ownable {
    address defaultRenderer;
    uint256 sheetPrice;

    constructor(address renderer, uint256 price) {
        defaultRenderer = renderer;
        sheetPrice = price;
    }

    function setDefaultRenderer(address renderer) external onlyOwner {
        defaultRenderer = renderer;
    }

    function addSheet(string calldata name) external payable returns (address sheetAddress) {
        if (msg.value != sheetPrice) {
            revert SheetPriceError(msg.value);
        }

        bytes memory bytecode = type(Sheet).creationCode;
        assembly {
            sheetAddress := create(0, add(bytecode, 32), mload(bytecode))
        }
        ISheet(sheetAddress).transferOwnership(msg.sender);
        ISheet(sheetAddress).setRenderer(defaultRenderer);
    }
}
