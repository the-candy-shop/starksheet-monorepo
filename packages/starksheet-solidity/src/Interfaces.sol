// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ICellRenderer {
    function tokenURI(uint256 token_id, uint256 value, string calldata name) external view returns (string memory);
}
