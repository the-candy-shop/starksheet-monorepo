// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct CellData {
    bool isValue;
    bytes data;
}

struct CellRendered {
    uint256 id;
    address owner;
    uint256 value;
}

library Cells {
    /*
    @notice Load a bytes array as a packed big endian uint
    */
    function parseValue(bytes memory data) public pure returns (uint256 value) {
        require(data.length < 33, "parseValue oveflow");

        assembly {
            let len := mload(data)
            let word := mload(add(data, 0x20))
            value := shr(sub(32, len), word)
        }
    }

    /*
    @notice The bytes array is a a packed version of a contract call where each parameters
    (contract address and call arguments) can be indeed the value of another token, hence a CellData
    */
    function parseData(bytes memory data)
        public
        pure
        returns (CellData memory target, bytes4 selector, CellData[] memory arguments)
    {
        if (uint8(data[0]) == 1) {
            // isValue = true
            target = CellData(true, data.toAddress());
        }
    }
}
