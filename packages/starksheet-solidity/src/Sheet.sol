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
    uint256 value;
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
    uint constant SHOULD_RENDER_FLAG = 2;

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
        uint256 value = _renderCell(id, true);
        return CellRendered(id, _ownerOf[id], value);
    }

    function _renderCell(uint256 value, bool valueIsToken) internal view returns (uint256) {
        if (valueIsToken == false) {
            return value;
        }

        if (cells[value].contractAddress == RC_BOUND) {
            return uint256(cells[value].value);
        }
    
        bool contractAddressIsTokenId = uint160(cells[value].contractAddress) < uint160(RC_BOUND);
        address renderedContractAddress = address(uint160(_renderCell(uint256(uint160(cells[value].contractAddress)), contractAddressIsTokenId)));

        uint256[] memory callData = abi.decode(cells[value].data, (uint256[]));

        bytes memory renderedCallData;
        for (uint256 i = 0; i < callData.length; i++) {
            bool isToken = callData[i] % 2 == 0;
            renderedCallData = bytes.concat(renderedCallData, bytes32(_renderCell(callData[i], isToken)));
        }
        bytes4 selector = bytes4(cells[value].value);
        (, bytes memory result) = renderedContractAddress.staticcall(abi.encodeWithSelector(selector, renderedCallData));
        return result.toUint256(0);
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
        uint256 value = _renderCell(id, true);
        return ICellRenderer(renderer).tokenURI(id, value, name);
    }

}
