import json
import logging
from pathlib import Path

import pandas as pd
from caseconverter import snakecase
from nile.common import ABIS_DIRECTORY, CONTRACTS_DIRECTORY
from nile.nre import NileRuntimeEnvironment

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def run(nre: NileRuntimeEnvironment) -> None:

    contract_name = "Starksheet"
    alias = snakecase(contract_name)
    arguments = [
        "0x" + "Starksheet".encode().hex(),
        "0x" + "STRK".encode().hex(),
        "0x01C8D2BB17CDDF22728553C9700ADFBBD42D1999194B409B1188B17191CC2EFD",
    ]

    contract_file = next(Path(CONTRACTS_DIRECTORY).glob(f"{contract_name}.cairo"))
    abi_file = Path(ABIS_DIRECTORY) / f"{contract_name}.json"
    prev_abi = {}
    try:
        address, _ = nre.get_deployment(alias)
        logger.info(
            f"Contract {contract_name} already deployed, checking differences..."
        )
        # TODO: we should pull the abi from the address to check if it changed
        # prev_abi = fetch_abi(address)
    except StopIteration:
        logger.info(f"No deployment found for contract {contract_name}")

    logger.info(f"Compiling contract {contract_name}...")
    nre.compile([contract_file])

    new_abi = json.load(open(abi_file))
    if new_abi != prev_abi:
        if prev_abi != {}:
            logger.info(f"Contract {contract_name} has changed, redeploying...")

        file = f"{nre.network}.deployments.txt"
        (
            pd.read_csv(file, names=["address", "abi", "alias"], sep=":")
            .loc[lambda df: df.alias != alias]  # type: ignore
            .to_csv(file, sep=":", index=False, header=False)
        )
        address, _ = nre.deploy(
            contract_name,
            alias=alias,
            arguments=arguments,
        )
        logger.info(f"Deployed {contract_name} at {address} in network {nre.network}")
    else:
        logger.info(f"Contract {contract_name} is up to date, skipping...")
