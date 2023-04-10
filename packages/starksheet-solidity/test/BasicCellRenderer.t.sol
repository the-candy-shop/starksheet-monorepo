// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/BasicCellRenderer.sol";
import "../src/Interfaces.sol";
import "openzeppelin/utils/Strings.sol";
import "@clemlaflemme/lib/utils/Array.sol";

contract BasicCellRendererTest is Test {
    BasicCellRenderer public renderer;
    using Strings for uint256;
    using Array for string[];

    function setUp() public {
        renderer = new BasicCellRenderer();
    }

    function testShouldRenderUri(uint256 id, uint256 value) public {
        string memory tokenUri = renderer.tokenURI(id, value, "name");
        string[] memory dump = new string[](3);
        dump[0] = "./dump.sh";
        dump[1] = string.concat("../dump/", id.toString(), "_", value.toString(), "_", "name.json");
        dump[2] = tokenUri;
        vm.ffi(dump);
    }

}
