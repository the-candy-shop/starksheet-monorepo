// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {MultiSendCallOnly} from "safe-contracts/libraries/MultiSendCallOnly.sol";
import {BasicCellRenderer} from "../src/BasicCellRenderer.sol";
import {Evmsheet} from "../src/Evmsheet.sol";
import {Math} from "../src/Math.sol";

contract EvmsheetScript is Script {
    Evmsheet public evmsheet;
    BasicCellRenderer public renderer;
    Math public math;
    MultiSendCallOnly public multicall;

    uint256 price = 0.01 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        multicall = new MultiSendCallOnly();
        renderer = new BasicCellRenderer();
        math = new Math();
        evmsheet = new Evmsheet(address(renderer), price);

        vm.stopBroadcast();
    }
}
