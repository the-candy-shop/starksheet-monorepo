// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Evmsheet.sol";
import "../src/BasicCellRenderer.sol";
import "../src/Interfaces.sol";

contract EvmsheetTest is Test {
    Evmsheet public evmsheet;
    ICellRenderer public renderer;

    uint256 price = 0.01 ether;

    function setUp() public {
        renderer = new BasicCellRenderer();
        evmsheet = new Evmsheet(address(renderer), price);
    }

    function testSetDefaultRenderer() public {
        address newRenderer = address(0x1234);
        evmsheet.setDefaultRenderer(newRenderer);
        assertEq(evmsheet.defaultRenderer(), newRenderer);
    }

    function testSetDefaultRendererShouldRevert() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert();
        address newRenderer = address(0x1234);
        evmsheet.setDefaultRenderer(newRenderer);
    }

    function testAddSheetShoultRevert() public {
        vm.expectRevert();
        evmsheet.addSheet("name", "SMB");
    }

    function testAddSheet() public {
        address newSheet = evmsheet.addSheet{value: price}("name", "SMB");
        assertEq(ISheet(newSheet).name(), "name");
        assertEq(ISheet(newSheet).symbol(), "SMB");
        assertEq(ISheet(newSheet).owner(), address(this));
        address[] memory sheets = evmsheet.getSheets();
        assertEq(sheets[0], newSheet);
        assertEq(sheets.length, 1);
    }
}
