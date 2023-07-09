// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Math {
    function sum(uint256[] memory arr) public pure returns (uint256) {
        uint256 res = 0;
        unchecked {
            for (uint256 i = 0; i < arr.length; i++) {
                res += arr[i];
            }
        }

        return res;
    }

    function prod(uint256[] memory arr) public pure returns (uint256) {
        uint256 res = 1;
        unchecked {
            for (uint256 i = 0; i < arr.length; i++) {
                res *= arr[i];
            }
        }

        return res;
    }

    function div(uint256 a, uint256 b) public pure returns (uint256) {
        return a / b;
    }

    function sub(uint256 a, uint256 b) public pure returns (uint256) {
        return a - b;
    }
}
