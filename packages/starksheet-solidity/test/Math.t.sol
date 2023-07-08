// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Math.sol";

contract MathTest is Test {
    Math public math;

    function setUp() public {
        math = new Math();
    }

    function testDiv(uint256 a, uint256 b) public {
        vm.assume(a >= b);
        vm.assume(b > 0);
        assertEq(math.div(a, b), a / b);
    }

    function testSub(uint256 a, uint256 b) public {
        vm.assume(a >= b);
        assertEq(math.sub(a, b), a - b);
    }

    function testProd(uint256 a, uint256 b) public {
        uint256[] memory arr = new uint256[](2);
        arr[0] = a;
        arr[1] = b;
        vm.assume(a < type(uint128).max);
        vm.assume(b < type(uint128).max);
        assertEq(math.prod(arr), a * b);
    }
}
