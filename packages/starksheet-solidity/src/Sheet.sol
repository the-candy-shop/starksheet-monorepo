// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "solmate/tokens/ERC721.sol";
import "openzeppelin/access/Ownable.sol";
import "./Interfaces.sol";

contract Sheet is Ownable, ERC721 {
    address renderer;

    constructor() ERC721("Sheet 0", "SHT") {}

    function setName(string calldata newName) public onlyOwner {
        name = newName;
    }

    function setRenderer(address newRender) public onlyOwner {
        renderer = newRender;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return ICellRenderer(renderer).tokenURI(id, 0, "");
    }
}
