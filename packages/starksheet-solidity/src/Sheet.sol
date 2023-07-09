// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "solmate/tokens/ERC721.sol";
import "openzeppelin/access/Ownable.sol";
import "./Interfaces.sol";
import "@clemlaflemme/lib/utils/Bytes.sol";

struct CellData {
    address contractAddress;
    bytes32 value;
    bytes data;
}

struct CellRendered {
    uint256 id;
    address owner;
    bytes value;
}

error SetCellIsNotOwnerError(address owner, address caller);
error NonExistantTokenError(uint256 id);

contract Sheet is Ownable, ERC721 {
    event CellUpdate(uint256 id, uint256 value, address contractAddress);
    event NameUpdate(string previousName, string newName);
    event SymbolUpdate(string previousSymbol, string newSymbol);

    using Bytes for bytes;

    uint256 public constant DEFAULT_VALUE = 2 ** 128 - 1;
    address public constant RC_BOUND = address(2 ** 128);
    uint256 constant _SHOULD_RENDER_FLAG = 2;
    uint256 public totalSupply;
    mapping(uint256 => uint256) public tokenByIndex;

    address public renderer;

    mapping(uint256 => CellData) public cells;

    function setCell(uint256 id, uint160 contractAddress, bytes32 value, bytes calldata data) public {
        if (_ownerOf[id] == address(0)) {
            _mint(tx.origin, id);
            tokenByIndex[totalSupply] = id;
            totalSupply += 1;
        } else {
            if (_ownerOf[id] != tx.origin) {
                revert SetCellIsNotOwnerError(_ownerOf[id], tx.origin);
            }
        }

        cells[id] = CellData(address(contractAddress), value, data);
    }

    function getCell(uint256 id) public view returns (address contractAddress, bytes32 value, bytes memory data) {
        if (_ownerOf[id] == address(0)) {
            contractAddress = RC_BOUND;
        } else {
            contractAddress = cells[id].contractAddress;
        }
        return (contractAddress, cells[id].value, cells[id].data);
    }

    function renderCell(uint256 id) public view returns (CellRendered memory) {
        bytes memory value = _renderCell(id);
        return CellRendered(id, _ownerOf[id], value);
    }

    function _isConstant(CellData memory cell) public pure returns (bool) {
        return cell.contractAddress == RC_BOUND;
    }

    function _renderValue(uint256 value) public pure returns (bool, uint256) {
        return (value % 2 == 1, value >> 1);
    }

    function _contractAddressIsTokenId(address contractAddress) public pure returns (bool) {
        return uint160(contractAddress) < uint160(RC_BOUND);
    }

    function callData2Uint256Array(bytes memory callData) public pure returns (uint256[] memory) {
        uint256[] memory output;
        assembly {
            let len := mload(callData)
            output := mload(0x40)
            mstore(output, div(len, 0x20))
            let _output := add(output, 0x20)
            let _callData := add(callData, 0x20)

            for { let i := 0 } lt(i, len) { i := add(i, 0x20) } { mstore(add(_output, i), mload(add(_callData, i))) }

            mstore(0x40, add(add(len, 0x20), output))
        }

        return output;
    }

    function _renderConstantCell(CellData memory cell) public pure returns (bytes memory) {
        // We just store the content of the value in the first bytes32 of result
        // as it would be if we staticcall a function that returns a bytes32
        return bytes.concat(cell.value);
    }

    function _renderContractAddress(address contractAddress) public view returns (address) {
        if (_contractAddressIsTokenId(contractAddress)) {
            bytes memory renderedContractAddressResult = _renderCell(uint256(uint160(contractAddress)));
            return address(uint160(renderedContractAddressResult.toUint256(0)));
        } else {
            return contractAddress;
        }
    }

    function _renderSelector(bytes32 selector) public pure returns (bytes4) {
        return bytes4(selector);
    }

    function _renderCallData(bytes memory callData) public view returns (bytes memory) {
        uint256[] memory callDataUint256 = callData2Uint256Array(callData);
        bytes memory renderedCallData;
        for (uint256 i = 0; i < callDataUint256.length; i++) {
            (bool isToken, uint256 arg) = _renderValue(callDataUint256[i]);
            if (isToken) {
                renderedCallData = bytes.concat(renderedCallData, bytes32(_renderCell(arg)));
            } else {
                renderedCallData = bytes.concat(renderedCallData, bytes32(arg));
            }
        }
        return renderedCallData;
    }

    function _renderCell(uint256 value) public view returns (bytes memory) {
        CellData memory cell = cells[value];

        if (_isConstant(cell)) {
            return _renderConstantCell(cell);
        }

        address renderedContractAddress = _renderContractAddress(cell.contractAddress);
        bytes4 selector = _renderSelector(cell.value);
        bytes memory callData = _renderCallData(cell.data);
        (, bytes memory result) = renderedContractAddress.staticcall(bytes.concat(selector, callData));
        return result;
    }

    constructor() ERC721("Sheet 0", "SHT0") {}

    function setName(string calldata newName) public onlyOwner {
        emit NameUpdate(name, newName);
        name = newName;
    }

    function setSymbol(string calldata newSymbol) public onlyOwner {
        emit SymbolUpdate(symbol, newSymbol);
        symbol = newSymbol;
    }

    function setRenderer(address newRender) public onlyOwner {
        renderer = newRender;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        address owner = _ownerOf[id];
        if (owner == address(0)) {
            revert NonExistantTokenError(id);
        }
        bytes memory value = _renderCell(id);
        return ICellRenderer(renderer).tokenURI(id, value, name);
    }
}
