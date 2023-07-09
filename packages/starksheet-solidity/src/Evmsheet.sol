// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "openzeppelin/access/Ownable.sol";
import "./Sheet.sol";

error SheetPriceError(uint256 price);

contract Evmsheet is Ownable {
    uint256 public sheetPrice;
    address public defaultRenderer;
    address[] public sheets;

    function getSheetCreationCode() public pure returns (bytes memory) {
        return type(Sheet).creationCode;
    }

    function getSheetCreationAddress(address sender, bytes32 salt) public pure returns (address) {
        return address(
            uint160(
                uint256(keccak256(abi.encodePacked(bytes1(0xff), sender, salt, keccak256(type(Sheet).creationCode))))
            )
        );
    }

    constructor(address renderer, uint256 price) {
        defaultRenderer = renderer;
        sheetPrice = price;
    }

    function setDefaultRenderer(address renderer) external onlyOwner {
        defaultRenderer = renderer;
    }

    function addSheet(string calldata name, string calldata symbol, bytes32 salt) external payable {
        if (msg.value != sheetPrice) {
            revert SheetPriceError(msg.value);
        }

        bytes memory bytecode = type(Sheet).creationCode;

        address sheetAddress;
        assembly {
            sheetAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        ISheet(sheetAddress).setRenderer(defaultRenderer);
        ISheet(sheetAddress).setName(name);
        ISheet(sheetAddress).setSymbol(symbol);
        ISheet(sheetAddress).transferOwnership(tx.origin);
        sheets.push(sheetAddress);
    }

    function getSheets() public view returns (address[] memory) {
        return sheets;
    }
}
