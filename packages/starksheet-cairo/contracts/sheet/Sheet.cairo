%lang starknet

from openzeppelin.access.ownable.library import Ownable
from openzeppelin.token.erc721.library import ERC721
from openzeppelin.token.erc721.enumerable.library import ERC721Enumerable
from openzeppelin.introspection.erc165.library import ERC165
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from starkware.cairo.common.math_cmp import is_not_zero, RC_BOUND
from starkware.cairo.common.uint256 import split_64, Uint256
from starkware.cairo.common.bool import TRUE
from starkware.starknet.common.syscalls import get_caller_address

from starkware.cairo.common.dict import DictAccess
from starkware.cairo.common.default_dict import default_dict_new, default_dict_finalize

from contracts.sheet.library import (
    Sheet,
    Sheet_merkle_root,
    Sheet_max_per_wallet,
    Sheet_cell_renderer,
    CellRendered,
    DEFAULT_VALUE,
)

@view
func getOwner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (owner: felt) {
    return Ownable.owner();
}

@external
func transferOwnership{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_owner: felt
) {
    Ownable.transfer_ownership(new_owner);
    return ();
}

@external
func setMaxPerWallet{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(max: felt) {
    Ownable.assert_only_owner();
    Sheet_max_per_wallet.write(max);
    return ();
}

@view
func getMaxPerWallet{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    max: felt
) {
    return Sheet_max_per_wallet.read();
}
@external
func setCellRenderer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    address: felt
) {
    Ownable.assert_only_owner();
    Sheet_cell_renderer.write(address);
    return ();
}

@view
func getCellRenderer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    address: felt
) {
    return Sheet_cell_renderer.read();
}

@external
func setMerkleRoot{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(root: felt) {
    Ownable.assert_only_owner();
    Sheet_merkle_root.write(root);
    return ();
}

@view
func getMerkleRoot{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    root: felt
) {
    let (root) = Sheet_merkle_root.read();
    return (root,);
}

@external
func setCell{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    tokenId: felt, contractAddress: felt, value: felt, cell_calldata_len: felt, cell_calldata: felt*
) {
    alloc_locals;
    let (low, high) = split_64(tokenId);
    let token_id = Uint256(low, high);

    with_attr error_message("setCell: tokenId does not exist") {
        let exist = ERC721._exists(token_id);
        assert exist = TRUE;
    }

    with_attr error_message("setCell: caller is not owner") {
        let (owner) = ERC721.owner_of(token_id);
        let (caller) = get_caller_address();
        assert owner = caller;
    }

    Sheet.set_cell(tokenId, contractAddress, value, cell_calldata_len, cell_calldata);
    return ();
}

@view
func getCell{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(tokenId: felt) -> (
    contractAddress: felt, value: felt, cell_calldata_len: felt, cell_calldata: felt*
) {
    let res = Sheet.get_cell(tokenId);
    return (res.contract_address, res.value, res.calldata_len, res.calldata);
}

@view
func renderCell{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(tokenId: felt) -> (
    cell: CellRendered
) {
    alloc_locals;
    let (local rendered_cells_start) = default_dict_new(default_value=DEFAULT_VALUE);
    let rendered_cells = rendered_cells_start;

    let (cell) = Sheet.render_cell{rendered_cells=rendered_cells}(tokenId);

    let (finalized_rendered_cells_start, finalized_rendered_cells_end) = default_dict_finalize(
        rendered_cells_start, rendered_cells, DEFAULT_VALUE
    );

    return (cell,);
}

@view
func renderCellValue{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    tokenId: felt
) -> (value: felt) {
    let (cell) = renderCell(tokenId);
    return (cell.value,);
}

@view
func renderGrid{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    cells_len: felt, cells: CellRendered*
) {
    alloc_locals;
    let (local cells: CellRendered*) = alloc();
    let (local rendered_cells_start) = default_dict_new(default_value=DEFAULT_VALUE);
    let rendered_cells = rendered_cells_start;
    let (total_supply) = ERC721Enumerable.total_supply();
    let stop = total_supply.low;
    Sheet.render_grid{cells=cells, rendered_cells=rendered_cells, stop=stop}(0);

    let (finalized_rendered_cells_start, finalized_rendered_cells_end) = default_dict_finalize(
        rendered_cells_start, rendered_cells, DEFAULT_VALUE
    );

    return (stop, cells);
}

@external
func mintPublic{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    tokenId: Uint256, proof_len: felt, proof: felt*
) {
    Sheet.mint(tokenId, proof_len, proof);
    let cell_calldata: felt* = alloc();
    Sheet.set_cell(
        token_id=tokenId.low,
        contract_address=RC_BOUND,
        value=0,
        cell_calldata_len=0,
        cell_calldata=cell_calldata,
    );
    return ();
}

@external
func mintAndSetPublic{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    tokenId: Uint256,
    proof_len: felt,
    proof: felt*,
    contractAddress: felt,
    value: felt,
    cellCalldata_len: felt,
    cellCalldata: felt*,
) {
    Sheet.mint(tokenId, proof_len, proof);
    Sheet.set_cell(
        token_id=tokenId.low,
        contract_address=contractAddress,
        value=value,
        cell_calldata_len=cellCalldata_len,
        cell_calldata=cellCalldata,
    );
    return ();
}

@view
func tokenURI{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    tokenId: Uint256
) -> (token_uri_len: felt, token_uri: felt*) {
    let (token_uri_len, token_uri) = Sheet.token_uri(tokenId);
    return (token_uri_len, token_uri);
}

//
// Token almost copied from OZ preset
// Constructor and tokenURI updated
//

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    name: felt,
    symbol: felt,
    owner: felt,
    merkle_root: felt,
    max_per_wallet: felt,
    renderer_address: felt,
) {
    ERC721.initializer(name, symbol);
    ERC721Enumerable.initializer();
    Ownable.initializer(owner);
    Sheet_merkle_root.write(merkle_root);
    Sheet_max_per_wallet.write(max_per_wallet);
    Sheet_cell_renderer.write(renderer_address);
    return ();
}

//
// Getters
//

@view
func totalSupply{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}() -> (
    totalSupply: Uint256
) {
    let (totalSupply: Uint256) = ERC721Enumerable.total_supply();
    return (totalSupply,);
}

@view
func tokenByIndex{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    index: Uint256
) -> (tokenId: Uint256) {
    let (tokenId: Uint256) = ERC721Enumerable.token_by_index(index);
    return (tokenId,);
}

@view
func tokenOfOwnerByIndex{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    owner: felt, index: Uint256
) -> (tokenId: Uint256) {
    let (tokenId: Uint256) = ERC721Enumerable.token_of_owner_by_index(owner, index);
    return (tokenId,);
}

@view
func supportsInterface{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    interfaceId: felt
) -> (success: felt) {
    let (success) = ERC165.supports_interface(interfaceId);
    return (success,);
}

@view
func name{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (name: felt) {
    let (name) = ERC721.name();
    return (name,);
}

@view
func symbol{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (symbol: felt) {
    let (symbol) = ERC721.symbol();
    return (symbol,);
}

@view
func balanceOf{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(owner: felt) -> (
    balance: Uint256
) {
    let (balance: Uint256) = ERC721.balance_of(owner);
    return (balance,);
}

@view
func ownerOf{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(tokenId: Uint256) -> (
    owner: felt
) {
    let (owner: felt) = ERC721.owner_of(tokenId);
    return (owner,);
}

@view
func getApproved{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    tokenId: Uint256
) -> (approved: felt) {
    let (approved: felt) = ERC721.get_approved(tokenId);
    return (approved,);
}

@view
func isApprovedForAll{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner: felt, operator: felt
) -> (isApproved: felt) {
    let (isApproved: felt) = ERC721.is_approved_for_all(owner, operator);
    return (isApproved,);
}

//
// Externals
//

@external
func approve{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    to: felt, tokenId: Uint256
) {
    ERC721.approve(to, tokenId);
    return ();
}

@external
func setApprovalForAll{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    operator: felt, approved: felt
) {
    ERC721.set_approval_for_all(operator, approved);
    return ();
}

@external
func transferFrom{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    from_: felt, to: felt, tokenId: Uint256
) {
    ERC721Enumerable.transfer_from(from_, to, tokenId);
    return ();
}

@external
func safeTransferFrom{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    from_: felt, to: felt, tokenId: Uint256, data_len: felt, data: felt*
) {
    ERC721Enumerable.safe_transfer_from(from_, to, tokenId, data_len, data);
    return ();
}

@external
func mintOwner{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(
    to: felt, tokenId: Uint256
) {
    Ownable.assert_only_owner();
    ERC721Enumerable._mint(to, tokenId);
    return ();
}

@external
func burn{pedersen_ptr: HashBuiltin*, syscall_ptr: felt*, range_check_ptr}(tokenId: Uint256) {
    ERC721.assert_only_token_owner(tokenId);
    ERC721Enumerable._burn(tokenId);
    return ();
}
