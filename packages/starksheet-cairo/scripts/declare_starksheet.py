# %% Imports
import logging
from asyncio import run

from dotenv import load_dotenv
from utils.constants import COMPILED_CONTRACTS
from utils.starknet import declare, dump_declarations, get_starknet_account

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Declarations
    account = await get_starknet_account()
    logger.info(f"ℹ️  Using account {hex(account.address)} as deployer")

    class_hash = {
        contract["contract_name"]: await declare(contract["contract_name"])
        for contract in COMPILED_CONTRACTS
    }
    dump_declarations(class_hash)


# %% Main
if __name__ == "__main__":
    run(main())
