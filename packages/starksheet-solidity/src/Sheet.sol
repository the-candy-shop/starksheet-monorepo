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
    event CellUpdate(uint256 id, bytes32 value, address contractAddress);
    event NameUpdate(string previousName, string newName);
    event SymbolUpdate(string previousSymbol, string newSymbol);

    using Bytes for bytes;

    uint256 public constant DEFAULT_VALUE = 2 ** 128 - 1;
    address public constant RC_BOUND = address(2 ** 128);
    uint256 constant SHOULD_RENDER_FLAG = 2;

    address renderer;

    mapping(uint256 => CellData) public cells;

    function setCell(uint256 id, address contractAddress, bytes32 value, bytes calldata data) public {
        if (_ownerOf[id] == address(0)) {
            _mint(msg.sender, id);
        } else {
            if (_ownerOf[id] != msg.sender) {
                revert SetCellIsNotOwnerError(_ownerOf[id], msg.sender);
            }
        }

        cells[id] = CellData(contractAddress, value, data);
    }

    function getCell(uint256 id) public view returns (address contractAddress, bytes32 value, bytes memory data) {
        return (cells[id].contractAddress, cells[id].value, cells[id].data);
    }

    function renderCell(uint256 id) public view returns (CellRendered memory) {
        bytes memory value = _renderCell(id);
        return CellRendered(id, _ownerOf[id], value);
    }

    function _isConstant(CellData memory cell) internal pure returns (bool) {
        return cell.contractAddress == RC_BOUND;
    }

    function _contractAddressIsTokenId(address contractAddress) internal pure returns (bool) {
        return uint160(contractAddress) < uint160(RC_BOUND);
    }

    function _renderCell(uint256 value) internal view returns (bytes memory) {
        CellData memory cell = cells[value];
        if (_isConstant(cell)) {
            return bytes.concat(cell.value);
        }

        address renderedContractAddress;
        if (_contractAddressIsTokenId(cell.contractAddress)) {
            bytes memory renderedContractAddressResult = _renderCell(uint256(uint160(cell.contractAddress)));
            renderedContractAddress = address(uint160(renderedContractAddressResult.toUint256(0)));
        } else {
            renderedContractAddress = cell.contractAddress;
        }

        uint256[] memory callData = abi.decode(cell.data, (uint256[]));

        bytes memory renderedCallData;
        for (uint256 i = 0; i < callData.length; i++) {
            bool isToken = callData[i] % 2 == 0;
            uint256 arg = callData[i] >> 1;
            if (isToken) {
                renderedCallData = bytes.concat(renderedCallData, bytes32(_renderCell(arg)));
            } else {
                renderedCallData = bytes.concat(renderedCallData, bytes32(arg));
            }
        }
        bytes4 selector = bytes4(cell.value);
        (, bytes memory result) = renderedContractAddress.staticcall(abi.encodeWithSelector(selector, renderedCallData));
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
