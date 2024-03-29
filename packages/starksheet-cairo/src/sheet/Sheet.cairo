%lang starknet

from openzeppelin.access.ownable.library import Ownable
from openzeppelin.introspection.erc165.library import ERC165
from openzeppelin.token.erc20.IERC20 import IERC20
from openzeppelin.token.erc721.enumerable.library import ERC721Enumerable
from openzeppelin.token.erc721.library import ERC721, ERC721_name, ERC721_symbol
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.bool import TRUE
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.default_dict import default_dict_new, default_dict_finalize
from starkware.cairo.common.dict import DictAccess
from starkware.cairo.common.math_cmp import is_not_zero, RC_BOUND
from starkware.cairo.common.uint256 import split_64, Uint256
from starkware.starknet.common.syscalls import get_caller_address, get_contract_address

from constants import ETH_ADDRESS
from sheet.library import (
    Sheet,
    Parameters,
    CellRendered,
    DEFAULT_VALUE,
)

from utils.execution_context import assert_view_call

@storage_var
func initialized() -> (res: felt) {
}

@view
func owner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (owner: felt) {
    return Ownable.owner();
}

@external
func transferOwnership{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_owner: felt
) {
    Ownable.transfer_ownership(new_owner);
    return ();
}

@view
func getParameters{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    parameters: Parameters
) {
    return Sheet.get_parameters();
}

@external
func setParameters{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(parameters: Parameters) {
    Ownable.assert_only_owner();
    Sheet.set_parameters(parameters);
    return ();
}

@external
func setMaxPerWallet{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(max: felt) {
    Ownable.assert_only_owner();
    Sheet.set_max_per_wallet(max);
    return ();
}

@view
func getMaxPerWallet{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    max: felt
) {
    let (max_per_wallet) = Sheet.get_max_per_wallet();
    return (max=max_per_wallet);
}

@external
func setCellPrice{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(price: felt) {
    Ownable.assert_only_owner();
    Sheet.set_cell_price(price);
    return ();
}

@view
func getCellPrice{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    price: felt
) {
    return Sheet.get_cell_price();
}

@external
func setSheetPrice{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(price: felt) {
    Ownable.assert_only_owner();
    Sheet.set_sheet_price(price);
    return ();
}

@view
func getSheetPrice{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    price: felt
) {
    return Sheet.get_sheet_price();
}

// @notice Royalty rate taken as per thousand, ie that inputing 1 give 0.1% of royalty over the sell price
@external
func setRoyaltyRate{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(rate: felt) {
    Ownable.assert_only_owner();
    Sheet.set_royalty_rate(rate);
    return ();
}

@view
func getRoyaltyRate{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    rate: felt
) {
    return Sheet.get_royalty_rate();
}

@view
func royaltyInfo{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    tokenId: Uint256, salePrice: Uint256
) -> (receiver: felt, royaltyAmount: Uint256) {
    let (receiver, royalty_amount) = Sheet.royalty_info(tokenId.low, salePrice.low);
    return (receiver, Uint256(low=royalty_amount, high=0));
}

@external
func setCellRenderer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    address: felt
) {
    Ownable.assert_only_owner();
    Sheet.set_cell_renderer(address);
    return ();
}

@view
func getCellRenderer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    address: felt
) {
    let (address) = Sheet.get_cell_renderer();
    return (address=address);
}

@external
func setIsPublic{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(is_public: felt) {
    Ownable.assert_only_owner();
    Sheet.set_is_public(is_public);
    return ();
}

@view
func getIsPublic{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    is_public: felt
) {
    return Sheet.get_is_public();
}

@external
func setMerkleRoot{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(root: felt) {
    Ownable.assert_only_owner();
    Sheet.set_merkle_root(root);
    return ();
}

@view
func getMerkleRoot{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    root: felt
) {
    let (root) = Sheet.get_merkle_root();
    return (root=root);
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

func _renderCell{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    tokenId: felt
) -> (cell: CellRendered) {
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
func renderCell{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(tokenId: felt) -> (
    cell: CellRendered
) {
    alloc_locals;
    assert_view_call();
    return _renderCell(tokenId);
}

@view
func renderCellValue{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    tokenId: felt
) -> (value: felt) {
    assert_view_call();
    let (cell) = _renderCell(tokenId);
    return (cell.value,);
}

@external
func executeCell{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(tokenId: felt) {
    let (is_public) = Sheet.get_is_public();

    if (is_public == 0) {
        Ownable.assert_only_owner();
        _renderCell(tokenId);
        return ();
    }

    _renderCell(tokenId);
    return ();
}

@view
func renderGrid{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    cells_len: felt, cells: CellRendered*
) {
    alloc_locals;
    assert_view_call();
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
    let (cell_price) = Sheet.get_cell_price();
    let (sender) = get_caller_address();
    let (recipient) = get_contract_address();
    IERC20.transferFrom(
        contract_address=ETH_ADDRESS,
        sender=sender,
        recipient=recipient,
        amount=Uint256(cell_price, 0),
    );
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
    let (cell_price) = Sheet.get_cell_price();
    let (sender) = get_caller_address();
    let (recipient) = get_contract_address();
    IERC20.transferFrom(
        contract_address=ETH_ADDRESS,
        sender=sender,
        recipient=recipient,
        amount=Uint256(cell_price, 0),
    );
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
    assert_view_call();
    let (token_uri_len, token_uri) = Sheet.token_uri(tokenId);
    return (token_uri_len, token_uri);
}

//
// Token almost copied from OZ preset
// Constructor and tokenURI updated
//

@external
func initialize{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    name: felt,
    symbol: felt,
    owner: felt,
    merkle_root: felt,
    max_per_wallet: felt,
    renderer_address: felt,
) {
    let (initialized_) = initialized.read();
    assert initialized_ = 0;
    ERC721.initializer(name, symbol);
    ERC721Enumerable.initializer();
    Ownable.initializer(owner);
    let parameters = Parameters(
        sheet_price=0,
        is_public=0,
        cell_price=0,
        royalty_rate=0,
        merkle_root=merkle_root,
        max_per_wallet=max_per_wallet,
        is_mint_open=1,
        cell_renderer=renderer_address,
    );
    Sheet.set_parameters(parameters);
    initialized.write(1);
    return ();
}

@view
func is_initialized{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    res: felt
) {
    let (initialized_) = initialized.read();
    return (res=initialized_);
}

@view
func contractURI{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    contractURI_len: felt, contractURI: felt*
) {
    let (contract_uri_len, contract_uri) = Sheet.contract_uri();
    return (contract_uri_len, contract_uri);
}

@external
func setContractUri{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    contract_uri_len: felt, contract_uri: felt*
) {
    Ownable.assert_only_owner();
    Sheet.set_contract_uri(contract_uri_len, contract_uri);
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
    if (interfaceId == 0x2a55205a) {
        // See https://eips.ethereum.org/EIPS/eip-2981
        return (1,);
    }
    let (success) = ERC165.supports_interface(interfaceId);
    return (success,);
}

@view
func name{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (name: felt) {
    let (name) = ERC721.name();
    return (name,);
}

@external
func setName{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(name: felt) {
    Ownable.assert_only_owner();
    ERC721_name.write(name);
    return ();
}

@view
func symbol{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (symbol: felt) {
    let (symbol) = ERC721.symbol();
    return (symbol,);
}

@external
func setSymbol{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(symbol: felt) {
    Ownable.assert_only_owner();
    ERC721_symbol.write(symbol);
    return ();
}

@external
func openMint{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() {
    Ownable.assert_only_owner();
    Sheet.open_mint();
    return ();
}

@external
func closeMint{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() {
    Ownable.assert_only_owner();
    Sheet.close_mint();
    return ();
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
