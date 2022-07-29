%lang starknet

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.math_cmp import is_not_zero
from starkware.cairo.common.uint256 import split_64, Uint256

from openzeppelin.utils.constants import TRUE
from openzeppelin.token.erc721.library import (
    ERC721_name,
    ERC721_symbol,
    ERC721_balanceOf,
    ERC721_ownerOf,
    ERC721_getApproved,
    ERC721_isApprovedForAll,
    ERC721_tokenURI,
    ERC721_initializer,
    ERC721_approve,
    ERC721_setApprovalForAll,
    ERC721_only_token_owner,
    ERC721_setTokenURI,
    _exists,
)
from openzeppelin.token.erc721_enumerable.library import (
    ERC721_Enumerable_initializer,
    ERC721_Enumerable_totalSupply,
    ERC721_Enumerable_tokenByIndex,
    ERC721_Enumerable_tokenOfOwnerByIndex,
    ERC721_Enumerable_mint,
    ERC721_Enumerable_burn,
    ERC721_Enumerable_transferFrom,
    ERC721_Enumerable_safeTransferFrom,
)
from openzeppelin.introspection.ERC165 import ERC165_supports_interface
from contracts.sheet.library import (
    CellRendered,
    Sheet_getCell,
    Sheet_setCell,
    Sheet_renderCell,
    Sheet_renderGrid,
    Sheet_mint,
    Sheet_tokenURI,
    Sheet_merkle_root,
    Sheet_max_per_wallet,
    Sheet_cell_renderer,
)

from openzeppelin.access.ownable import (
    Ownable_initializer,
    Ownable_only_owner,
    Ownable_get_owner,
    Ownable_transfer_ownership,
)

const GRID_SIZE = 15 * 15

@view
func getOwner{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    owner : felt
):
    return Ownable_get_owner()
end

@external
func transferOwnership{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    new_owner : felt
):
    Ownable_transfer_ownership(new_owner)
    return ()
end

@external
func setMaxPerWallet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(max : felt):
    Ownable_only_owner()
    Sheet_max_per_wallet.write(max)
    return ()
end

@view
func getMaxPerWallet{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    max : felt
):
    return Sheet_max_per_wallet.read()
end
@external
func setCellRenderer{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    address : felt
):
    Ownable_only_owner()
    Sheet_cell_renderer.write(address)
    return ()
end

@view
func getCellRenderer{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    address : felt
):
    return Sheet_cell_renderer.read()
end

@external
func setMerkleRoot{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(root : felt):
    Ownable_only_owner()
    Sheet_merkle_root.write(root)
    return ()
end

@view
func getMerkleRoot{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    root : felt
):
    let (root) = Sheet_merkle_root.read()
    return (root)
end

@external
func setCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    contractAddress : felt,
    tokenId : felt,
    value : felt,
    dependencies_len : felt,
    dependencies : felt*,
):
    alloc_locals
    let (low, high) = split_64(tokenId)
    let token_id = Uint256(low, high)

    with_attr error_message("setCell: tokenId does not exist"):
        let (exist) = _exists(token_id)
        assert exist = TRUE
    end

    with_attr error_message("setCell: caller is not owner"):
        let (owner) = ERC721_ownerOf(token_id)
        let (caller) = get_caller_address()
        assert owner = caller
    end

    Sheet_setCell(contractAddress, tokenId, value, dependencies_len, dependencies)
    return ()
end

@view
func getCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(tokenId : felt) -> (
    contractAddress : felt, value : felt, dependencies_len : felt, dependencies : felt*
):
    let res = Sheet_getCell(tokenId)
    return (res.contract_address, res.value, res.dependencies_len, res.dependencies)
end

@view
func renderCell{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : felt
) -> (cell : CellRendered):
    let (cell) = Sheet_renderCell(tokenId)
    return (cell)
end

@view
func renderGrid{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
    cells_len : felt, cells : CellRendered*
):
    alloc_locals
    let (local cells : CellRendered*) = alloc()
    let stop = GRID_SIZE
    Sheet_renderGrid{cells=cells, stop=stop}(0)
    return (GRID_SIZE, cells)
end

@external
func mintPublic{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    tokenId : Uint256, proof_len : felt, proof : felt*
):
    Sheet_mint(tokenId, proof_len, proof)
    return ()
end

@view
func tokenURI{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : Uint256
) -> (token_uri_len : felt, token_uri : felt*):
    let (token_uri_len, token_uri) = Sheet_tokenURI(tokenId)
    return (token_uri_len, token_uri)
end

#
# Token almost copied from OZ preset
# Constructor and tokenURI updated
#

@constructor
func constructor{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    name : felt,
    symbol : felt,
    owner : felt,
    merkle_root : felt,
    max_per_wallet : felt,
    renderer_address : felt,
):
    ERC721_initializer(name, symbol)
    ERC721_Enumerable_initializer()
    Ownable_initializer(owner)
    Sheet_merkle_root.write(merkle_root)
    Sheet_max_per_wallet.write(max_per_wallet)
    Sheet_cell_renderer.write(renderer_address)
    return ()
end

#
# Getters
#

@view
func totalSupply{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}() -> (
    totalSupply : Uint256
):
    let (totalSupply : Uint256) = ERC721_Enumerable_totalSupply()
    return (totalSupply)
end

@view
func tokenByIndex{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    index : Uint256
) -> (tokenId : Uint256):
    let (tokenId : Uint256) = ERC721_Enumerable_tokenByIndex(index)
    return (tokenId)
end

@view
func tokenOfOwnerByIndex{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    owner : felt, index : Uint256
) -> (tokenId : Uint256):
    let (tokenId : Uint256) = ERC721_Enumerable_tokenOfOwnerByIndex(owner, index)
    return (tokenId)
end

@view
func supportsInterface{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    interfaceId : felt
) -> (success : felt):
    let (success) = ERC165_supports_interface(interfaceId)
    return (success)
end

@view
func name{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (name : felt):
    let (name) = ERC721_name()
    return (name)
end

@view
func symbol{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (symbol : felt):
    let (symbol) = ERC721_symbol()
    return (symbol)
end

@view
func balanceOf{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(owner : felt) -> (
    balance : Uint256
):
    let (balance : Uint256) = ERC721_balanceOf(owner)
    return (balance)
end

@view
func ownerOf{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : Uint256
) -> (owner : felt):
    let (owner : felt) = ERC721_ownerOf(tokenId)
    return (owner)
end

@view
func getApproved{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    tokenId : Uint256
) -> (approved : felt):
    let (approved : felt) = ERC721_getApproved(tokenId)
    return (approved)
end

@view
func isApprovedForAll{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    owner : felt, operator : felt
) -> (isApproved : felt):
    let (isApproved : felt) = ERC721_isApprovedForAll(owner, operator)
    return (isApproved)
end

#
# Externals
#

@external
func approve{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    to : felt, tokenId : Uint256
):
    ERC721_approve(to, tokenId)
    return ()
end

@external
func setApprovalForAll{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    operator : felt, approved : felt
):
    ERC721_setApprovalForAll(operator, approved)
    return ()
end

@external
func transferFrom{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    from_ : felt, to : felt, tokenId : Uint256
):
    ERC721_Enumerable_transferFrom(from_, to, tokenId)
    return ()
end

@external
func safeTransferFrom{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    from_ : felt, to : felt, tokenId : Uint256, data_len : felt, data : felt*
):
    ERC721_Enumerable_safeTransferFrom(from_, to, tokenId, data_len, data)
    return ()
end

@external
func mintOwner{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
    to : felt, tokenId : Uint256
):
    Ownable_only_owner()
    ERC721_Enumerable_mint(to, tokenId)
    return ()
end

@external
func burn{pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(tokenId : Uint256):
    ERC721_only_token_owner(tokenId)
    ERC721_Enumerable_burn(tokenId)
    return ()
end
