//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Starksheet is ERC721 {
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    struct TokenData {
        uint256[] dependencies;
        string methodIdentifier;
        uint256 value;
    }

    mapping(uint256 => TokenData) public _cells;

    function add(uint256[] calldata input) public pure returns (uint256) {
        uint256 res;
        for (uint256 i = 0; i < input.length; i++) {
            res += input[i];
        }
        return res;
    }

    function mul(uint256[] calldata input) public pure returns (uint256) {
        uint256 res = 1;
        for (uint256 i = 0; i < input.length; i++) {
            res = res * input[i];
        }
        return res;
    }

    function setContent(uint256 tokenId, TokenData calldata _tokenData) public {
        _cells[tokenId].methodIdentifier = _tokenData.methodIdentifier;
        _cells[tokenId].dependencies = new uint256[](
            _tokenData.dependencies.length
        );
        for (uint256 i = 0; i < _tokenData.dependencies.length; i++) {
            _cells[tokenId].dependencies[i] = _tokenData.dependencies[i];
        }
        _cells[tokenId].value = _tokenData.value;
    }

    function render(uint256 tokenId) public returns (uint256) {
        TokenData memory tokenData = _cells[tokenId];

        if (bytes(tokenData.methodIdentifier).length == 0) {
            return tokenData.value;
        }

        bytes4 methodIdentifier = bytes4(
            keccak256(
                bytes(string.concat(tokenData.methodIdentifier, "(uint256[])"))
            )
        );
        uint256[] memory depsValues = new uint256[](
            tokenData.dependencies.length
        );
        for (uint256 i = 0; i < tokenData.dependencies.length; i++) {
            depsValues[i] = this.render(tokenData.dependencies[i]);
        }
        (bool success, bytes memory returnData) = address(this).call(
            abi.encodeWithSelector(methodIdentifier, depsValues)
        );
        if (!success) revert("Could not compute");
        uint256 result;
        assembly {
            result := mload(add(returnData, 0x20))
        }
        return result;
    }
}
