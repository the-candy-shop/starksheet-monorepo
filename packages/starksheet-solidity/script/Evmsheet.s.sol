// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/BasicCellRenderer.sol";
import "../src/Evmsheet.sol";
import {Math as SimpleMath} from "../src/Math.sol";

contract EvmsheetScript is Script {
    Evmsheet public evmsheet;
    ICellRenderer public renderer;
    SimpleMath public math;

    uint256 price = 0.01 ether;

    function run() external {

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        renderer = new BasicCellRenderer();
        math = new SimpleMath();
        evmsheet = new Evmsheet(address(renderer), price);

        vm.stopBroadcast();
    }
}
