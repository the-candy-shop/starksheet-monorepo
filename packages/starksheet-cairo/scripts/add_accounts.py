# %% Imports
import logging
import os
import random
from asyncio import run
from pathlib import Path

from dotenv import load_dotenv
from utils.starknet import deploy_starknet_account

load_dotenv()
logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Get parameters from env
    amount = float(os.getenv("AMOUNT", 0.01))
    count = int(os.getenv("COUNT", 1))

    # %% Deploy accounts
    for i in range(count):
        private_key = random.randbytes(31).hex()
        account = await deploy_starknet_account(private_key=private_key, amount=amount)
        Path(f"{i}").mkdir(exist_ok=True, parents=True)
        (Path(f"{i}") / ".env").write_text(
            f"ACCOUNT_ADDRESS=0x{account.address:x}\nPRIVATE_KEY=0x{private_key}\n"
            f"STARKNET_ACCOUNT_ADDRESS=0x{account.address:x}\nSTARKNET_PRIVATE_KEY=0x{private_key}\n"
        )


# %% Main
if __name__ == "__main__":
    run(main())
