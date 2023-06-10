// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ICellRenderer {
    function tokenURI(uint256 id, bytes memory value, string calldata name) external view returns (string memory);
}

interface ISheet {
    function setRenderer(address newRenderer) external;
    function transferOwnership(address newOwner) external;
    function setName(string calldata newName) external;
    function setSymbol(string calldata newName) external;
    function name() external returns (string memory);
    function symbol() external returns (string memory);
    function owner() external returns (address);
}
