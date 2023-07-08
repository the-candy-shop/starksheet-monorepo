// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Sheet.sol";
import {Math} from "../src/Math.sol";
import {BasicCellRenderer} from "../src/BasicCellRenderer.sol";
import "../src/Interfaces.sol";
import {MultiSendCallOnly} from "safe-contracts/libraries/MultiSendCallOnly.sol";

contract SheetTest is Test {
    Sheet public sheet;
    Math public math;
    ICellRenderer public renderer;
    MultiSendCallOnly public multicall;

    using Bytes for bytes;

    function setUp() public {
        sheet = new Sheet();
        math = new Math();
        renderer = new BasicCellRenderer();
        sheet.setRenderer(address(renderer));
        multicall = new MultiSendCallOnly();
    }

    function testSetCellShouldMint() public {
        uint256 supply = sheet.balanceOf(tx.origin);
        assertEq(supply, 0);
        bytes memory data;
        sheet.setCell(1337, 0xdead, bytes32(uint256(0xdead)), data);
        supply = sheet.balanceOf(tx.origin);
        assertEq(supply, 1);
        (address contractAddress, bytes32 value, bytes memory data_) = sheet.getCell(1337);
        assertEq(contractAddress, address(0xdead));
        assertEq(uint256(value), uint256(0xdead));
        assertEq(data_, data);
    }

    function testMulticallSetCell() public {
        bytes memory data;
        bytes memory encodedCall = abi.encodeCall(sheet.setCell, (0, uint160(2 ** 128), bytes32(uint256(0x856)), data));
        bytes memory transaction = bytes.concat(
            bytes1(0x00), // operation
            bytes20(address(sheet)), // address
            bytes32(0), // value
            bytes32(encodedCall.length), // calldata len
            encodedCall // calldata
        );
        multicall.multiSend(transaction);
        (address contractAddress, bytes32 value,) = sheet.getCell(0);
        assertEq(contractAddress, address(2 ** 128));
        assertEq(value, bytes32(uint256(0x856)));
    }

    function testSetCellShouldFailWhenNotOwner() public {
        bytes memory data;
        sheet.setCell(1337, 0xdead, bytes32(uint256(0xdead)), data);
        vm.expectRevert();
        vm.prank(address(0xdead), address(0xdead));
        sheet.setCell(1337, 0xdead, bytes32(uint256(0xdead)), data);
    }

    function testGetCellShouldReturnRcBoundIfNotExist() public {
        (address contractAddress, bytes32 value, bytes memory data_) = sheet.getCell(1337);
        assertEq(contractAddress, address(2 ** 128));
        assertEq(uint256(value), uint256(0));
        bytes memory empty;
        assertEq(data_, empty);
    }

    function testTokenUriShouldFailIfNotExist() public {
        vm.expectRevert();
        sheet.tokenURI(0);
    }

    function testTokenUri() public {
        bytes memory data;
        sheet.setCell(1337, uint160(sheet.RC_BOUND()), bytes32(uint256(1234)), data);
        string memory tokenUri = sheet.tokenURI(1337);
        string[] memory dump = new string[](3);
        dump[0] = "./dump.sh";
        dump[1] = string.concat("../dump/", "sheet_tokenURI.json");
        dump[2] = tokenUri;
        vm.ffi(dump);
    }

    function testCallData2Uint256Array(uint256 a, uint256 b) public {
        bytes memory callData = abi.encodePacked(a, b);
        uint256[] memory array = sheet.callData2Uint256Array(callData);
        assertEq(array[0], a);
        assertEq(array[1], b);
    }

    function testIsConstant(CellData memory cell) public {
        bool _constant = sheet._isConstant(cell);
        assertEq(_constant, cell.contractAddress == address(uint160(2 ** 128)));
    }

    function testRenderContractAddress(address contractAddress) public {
        vm.assume(uint160(contractAddress) > 2 ** 128);
        assertEq(sheet._renderContractAddress(contractAddress), contractAddress);
    }

    function testRenderSelector(bytes32 selector) public {
        assertEq(sheet._renderSelector(selector), bytes4(selector));
    }

    function testRenderCallData(uint256 a, uint256 b) public {
        vm.assume(a < 2 ** 255);
        vm.assume(b < 2 ** 255);
        bytes memory callData = bytes.concat(bytes32(uint256(a * 2)), bytes32(uint256(b * 2)));
        bytes memory expectedCallData = bytes.concat(bytes32(a), bytes32(b));
        bytes memory renderedCallData = sheet._renderCallData(callData);
        assertEq(renderedCallData, expectedCallData);
    }

    function testRenderConstantCell() public {
        bytes memory data;
        sheet.setCell(1337, uint160(sheet.RC_BOUND()), bytes32(uint256(1234)), data);
        CellRendered memory cellRendered = sheet.renderCell(1337);
        (, bytes32 value,) = sheet.getCell(1337);
        assertEq(cellRendered.value.toUint256(0), uint256(1234));
        assertEq(cellRendered.value.toBytes32(0), value);
    }

    function testRenderDynamicCell(uint256 a, uint256 b) public {
        vm.assume(a < 2 ** 255);
        vm.assume(b < 2 ** 255);
        bytes32 selector = bytes32(math.sub.selector);
        bytes memory callData;
        callData = abi.encode(a, b);
        (, bytes memory expectedResult) = address(math).staticcall(bytes.concat(bytes4(selector), callData));

        callData = abi.encode(a * 2, b * 2);
        sheet.setCell(1337, uint160(address(math)), selector, callData);
        CellRendered memory cell = sheet.renderCell(1337);

        assertEq(cell.value.toUint256(0), expectedResult.toUint256(0));
    }
}
