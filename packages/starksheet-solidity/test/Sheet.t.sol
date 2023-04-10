// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Sheet.sol";
import "../src/BasicCellRenderer.sol";
import "../src/Interfaces.sol";

contract SheetTest is Test {
    Sheet public sheet;
    ICellRenderer public renderer;

    function setUp() public {
        sheet = new Sheet();
        renderer = new BasicCellRenderer();
        sheet.setRenderer(address(renderer));
    }

    function testSetCellShouldMint() public {
        uint256 supply = sheet.balanceOf(address(this));
        assertEq(supply, 0);
        bytes memory data;
        sheet.setCell(1337, address(0xdead), bytes32(uint256(0xdead)), data);
        supply = sheet.balanceOf(address(this));
        assertEq(supply, 1);
        (address contractAddress, bytes32 value, bytes memory data_) = sheet.getCell(1337);
        assertEq(contractAddress, address(0xdead));
        assertEq(value, bytes32(uint256(0xdead)));
        assertEq(data_, data);
    }

    function testSetCellShouldFailWhenNotOwner() public {
        bytes memory data;
        sheet.setCell(1337, address(0xdead), bytes32(uint256(0xdead)), data);
        vm.expectRevert();
        vm.prank(address(0xdead));
        sheet.setCell(1337, address(0xdead), bytes32(uint256(0xdead)), data);
    }

    function testGetCellShouldReturnEmptyIfNotExist() public {
        (address contractAddress, bytes32 value, bytes memory data_) = sheet.getCell(1337);
        assertEq(contractAddress, address(0));
        assertEq(value, bytes32(uint256(0)));
        bytes memory empty;
        assertEq(data_, empty);
    }

    function testTokenUriShouldFailIfNotExist() public {
        vm.expectRevert();
        sheet.tokenURI(0);
    }

    function testTokenUri() public {
        bytes memory data;
        sheet.setCell(1337, sheet.RC_BOUND(), bytes32(uint256(1234)), data);
        string memory tokenUri = sheet.tokenURI(1337);
        string[] memory dump = new string[](3);
        dump[0] = "./dump.sh";
        dump[1] = string.concat("../dump/", "sheet_tokenURI.json");
        dump[2] = tokenUri;
        vm.ffi(dump);
    }
}
