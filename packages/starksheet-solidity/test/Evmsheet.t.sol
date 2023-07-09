// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Evmsheet.sol";
import "../src/BasicCellRenderer.sol";
import "../src/Interfaces.sol";
import {MultiSendCallOnly} from "safe-contracts/libraries/MultiSendCallOnly.sol";

contract EvmsheetTest is Test {
    Evmsheet public evmsheet;
    ICellRenderer public renderer;
    MultiSendCallOnly public multicall;

    uint256 price = 0.01 ether;

    function setUp() public {
        renderer = new BasicCellRenderer();
        evmsheet = new Evmsheet(address(renderer), price);
        multicall = new MultiSendCallOnly();
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
        evmsheet.addSheet("name", "SMB", 0);
    }

    function testAddSheet() public {
        evmsheet.addSheet{value: price}("name", "SMB", 0);
        address newSheet = evmsheet.sheets(0);
        assertEq(ISheet(newSheet).name(), "name");
        assertEq(ISheet(newSheet).symbol(), "SMB");
        assertEq(ISheet(newSheet).owner(), tx.origin);
    }

    function testMulticallAddSheet() public {
        bytes memory encodedCall = abi.encodeCall(evmsheet.addSheet, ("Sheet0", "SHT0", 0));
        bytes memory transaction = bytes.concat(
            bytes1(0x00), // operation
            bytes20(address(evmsheet)), // address
            bytes32(price), // value
            bytes32(encodedCall.length), // calldata len
            encodedCall // calldata
        );
        multicall.multiSend{value: price}(transaction);
        address newSheet = evmsheet.sheets(0);
        assertEq(ISheet(newSheet).name(), "Sheet0");
        assertEq(ISheet(newSheet).symbol(), "SHT0");
        assertEq(ISheet(newSheet).owner(), tx.origin);
    }
}
