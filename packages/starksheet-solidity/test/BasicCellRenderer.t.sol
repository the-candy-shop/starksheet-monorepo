// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/BasicCellRenderer.sol";
import "../src/Interfaces.sol";
import "openzeppelin/utils/Strings.sol";
import "@clemlaflemme/lib/utils/Array.sol";
import "@clemlaflemme/lib/utils/Bytes.sol";

contract BasicCellRendererTest is Test {
    BasicCellRenderer public renderer;

    using Strings for uint256;
    using Array for string[];
    using Bytes for bytes;

    function setUp() public {
        renderer = new BasicCellRenderer();
    }

    function testShouldRenderUri(uint256 id, bytes memory value) public {
        vm.assume(value.length >= 32);
        string memory tokenUri = renderer.tokenURI(id, value, "name");
        string[] memory dump = new string[](3);
        dump[0] = "./dump.sh";
        dump[1] = string.concat("../dump/", id.toString(), "_", value.toUint256(0).toString(), "_", "name.json");
        dump[2] = tokenUri;
        vm.ffi(dump);
    }
}
