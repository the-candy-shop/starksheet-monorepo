// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Interfaces.sol";

contract BasicCellRenderer is ICellRenderer {
    function tokenUri(uint256 token_id, uint256 value, string calldata name) external view returns (string memory) {
        return "tokenUri";
    }
}
