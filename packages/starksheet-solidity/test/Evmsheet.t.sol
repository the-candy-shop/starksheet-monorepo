// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Evmsheet.sol";
import "../src/BasicCellRenderer.sol";

contract EvmsheetTest is Test {
    Evmsheet public evmsheet;
    CellRenderer public renderer;

    function setUp() public {
        render = new BasicCellRenderer();
        evmsheet = new Evmsheet();
        evmsheet.setNumber(0);
    }

    function testIncrement() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    function testSetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
