# %% Imports and query
import itertools
import json
import logging
import math
import shlex
import subprocess
import time
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

url = "https://starkscan.stellate.sh/"
headers = {
    "authority": "starkscan.stellate.sh",
    "accept": "application/json",
    "content-type": "application/json",
    "origin": "https://starkscan.co",
    "referer": "https://starkscan.co/",
    "sec-ch-ua": '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
}


def get_contracts_calls(contract_addresses):
    timestamps = (
        json.load(open("timestamps.json")) if Path("timestamps.json").is_file() else {}
    )
    data = {
        "query": """query AccountCallsTableQuery(
                    $after: String,
                    $first: Int!,
                    $input: CallsInput!
                    ) {
                    ...AccountCallsTablePaginationFragment_calls_2DAjA4
                    }
                    fragment AccountCallsTablePaginationFragment_calls_2DAjA4 on Query {
                    calls(first: $first, after: $after, input: $input) {
                        edges {
                        node {
                            ...AccountCallsTableRowFragment_call
                        }
                        }
                        pageInfo {
                        endCursor
                        hasNextPage
                        }
                    }
                    }
                    fragment AccountCallsTableRowFragment_call on Call {
                    contract_identifier
                    timestamp
                    selector_name
                    caller_address
                    transaction_hash
                    }
                    """,
        "variables": {
            "after": None,
            "first": 1000,
            "input": {
                "contract_address": "0x071d48483dcfa86718a717f57cf99a72ff8198b4538a6edccd955312fe624747",
                "is_account_call": True,
                "max_block_number": None,
                "max_timestamp": None,
                "min_block_number": None,
                "min_timestamp": None,
                "order_by": "asc",
                "sort_by": "timestamp",
            },
        },
    }
    header = [
        "contract_identifier",
        "timestamp",
        "selector_name",
        "caller_address",
        "class_hash",
        "transaction_hash",
    ]

    def get_contract_calls(contract_address):
        data["variables"]["after"] = None
        data["variables"]["input"]["contract_address"] = contract_address
        data["variables"]["input"]["min_timestamp"] = timestamps.get(contract_address)
        data_raw = json.dumps(data).replace("\\n", "")
        res = subprocess.run(
            shlex.split(
                f"""curl 'https://api.starkscancdn.com/graphql' -H 'authority: api.starkscancdn.com' -H 'accept: application/json' -H 'accept-language: en-US,en;q=0.9' -H 'content-type: application/json' -H 'dnt: 1' -H 'origin: https://starkscan.co' -H 'referer: https://starkscan.co/' -H 'sec-ch-ua: "Not=A?Brand";v="99", "Chromium";v="118"' -H 'sec-ch-ua-mobile: ?0' -H 'sec-ch-ua-platform: "macOS"' -H 'sec-fetch-dest: empty' -H 'sec-fetch-mode: cors' -H 'sec-fetch-site: cross-site' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36' --data-raw '{data_raw}' --compressed"""
            ),
            capture_output=True,
        )
        response = json.loads(res.stdout.decode())
        _calls = response["data"]["calls"]["edges"]
        page_info = response["data"]["calls"]["pageInfo"]
        if not _calls:
            timestamps[contract_address] = math.floor(
                pd.Timestamp.now(tz="UTC").timestamp()
            )
            return []

        timestamps[contract_address] = _calls[-1]["node"]["timestamp"]
        page = 0
        while page_info["hasNextPage"]:
            page += 1
            logger.info(f"⏳ contract {contract_address}: fetching page {page}")
            data["variables"]["after"] = page_info["endCursor"]

            data_raw = json.dumps(data).replace("\\n", "")
            res = subprocess.run(
                shlex.split(
                    f"""curl 'https://api.starkscancdn.com/graphql' -H 'authority: api.starkscancdn.com' -H 'accept: application/json' -H 'accept-language: en-US,en;q=0.9' -H 'content-type: application/json' -H 'dnt: 1' -H 'origin: https://starkscan.co' -H 'referer: https://starkscan.co/' -H 'sec-ch-ua: "Not=A?Brand";v="99", "Chromium";v="118"' -H 'sec-ch-ua-mobile: ?0' -H 'sec-ch-ua-platform: "macOS"' -H 'sec-fetch-dest: empty' -H 'sec-fetch-mode: cors' -H 'sec-fetch-site: cross-site' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36' --data-raw '{data_raw}' --compressed"""
                ),
                capture_output=True,
            )
            response = json.loads(res.stdout.decode())

            _calls += response["data"]["calls"]["edges"]
            page_info = response["data"]["calls"]["pageInfo"]
            timestamps[contract_address] = _calls[-1]["node"]["timestamp"]

        timestamps[contract_address] = math.floor(
            pd.Timestamp.now(tz="UTC").timestamp()
        )
        return [call["node"] for call in _calls]

    previous_calls = (
        pd.read_csv(
            "calls.csv",
            dtype={"contract_identifier": str},
            parse_dates=["timestamp"],
        )
        if Path("calls.csv").is_file()
        else pd.DataFrame(
            columns=header,
            dtype={"contract_identifier": str},
        ).astype({"timestamp": int})
    )
    logger.info(
        f"📈 sheets up to "
        f"{pd.Timestamp(max(timestamps.values()), unit='s', tz='UTC').tz_convert(tz='Europe/Paris')}: "
        f"{len(previous_calls)}"
    )

    calls = (
        pd.concat(
            [
                (
                    pd.DataFrame(
                        itertools.chain.from_iterable(
                            [
                                get_contract_calls(address)
                                for address in contract_addresses
                            ]
                        )
                    )
                    .reindex(header, axis=1)
                    .loc[lambda df: df.selector_name == "addSheet"]
                    .astype({"timestamp": "datetime64[s]", "contract_identifier": str})
                    .assign(
                        contract_identifier=lambda df: df.contract_identifier.str.extract(
                            r"(v\d+)"
                        ),
                        class_hash=lambda df: get_class_hashes(
                            df.caller_address.tolist()
                        ),
                    )
                ),
                previous_calls,
            ],
            ignore_index=True,
        )
        .sort_values("timestamp", ascending=False)
        .drop_duplicates("transaction_hash")
    )
    json.dump(timestamps, open("timestamps.json", "w"), indent=4)
    calls.to_csv("calls.csv", index=False)
    return calls


def get_class_hashes(contract_addresses):
    labels = {
        "0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918": "Argent",
        "0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003": "Argent",
        "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e": "Braavos",
    }
    known_classes = (
        json.load(open("class_hashes.json"))
        if Path("class_hashes.json").is_file()
        else {}
    )

    def get_clash_hash(contract_address):
        if known_classes.get(contract_address):
            return known_classes.get(contract_address)

        data = {
            "query": """query ContractPageQuery(
          $input: ContractInput!
        ) {
          contract(input: $input) {
            contract_address
            class_hash
            id
          }
        }""",
            "variables": {"input": {"contract_address": contract_address}},
        }

        data_raw = json.dumps(data).replace("\\n", "")
        res = subprocess.run(
            shlex.split(
                f"""curl 'https://api.starkscancdn.com/graphql' -H 'authority: api.starkscancdn.com' -H 'accept: application/json' -H 'accept-language: en-US,en;q=0.9' -H 'content-type: application/json' -H 'dnt: 1' -H 'origin: https://starkscan.co' -H 'referer: https://starkscan.co/' -H 'sec-ch-ua: "Not=A?Brand";v="99", "Chromium";v="118"' -H 'sec-ch-ua-mobile: ?0' -H 'sec-ch-ua-platform: "macOS"' -H 'sec-fetch-dest: empty' -H 'sec-fetch-mode: cors' -H 'sec-fetch-site: cross-site' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36' --data-raw '{data_raw}' --compressed"""
            ),
            capture_output=True,
        )
        response = json.loads(res.stdout.decode())

        class_hash = response["data"]["contract"]["class_hash"]
        known_classes[contract_address] = class_hash
        return class_hash

    class_hashes = []
    i = 0
    while i < len(contract_addresses):
        address = contract_addresses[i]
        try:
            class_hashes += [get_clash_hash(address)]
            i += 1
        except:
            time.sleep(60)
    json.dump(known_classes, open("class_hashes.json", "w"), indent=4)
    return [labels.get(class_hash, class_hash) for class_hash in class_hashes]


# %% Fetch data
calls = get_contracts_calls(
    contract_addresses=[
        "0x028850a764600d53b2009b17428ae9eb980a4c4ea930a69ed8668048ef082a04",
        "0x076a028b19d27310f5e9f941041ae4a3a52c0e0024d593ddcb0d34e1dcd24af1",
        "0x071d48483dcfa86718a717f57cf99a72ff8198b4538a6edccd955312fe624747",
    ]
)
logger.info(f"📈 sheets: {len(calls)}")

# %% Plot daily sheet creation
# define the date range for the plot
plt.clf()
start_date = pd.Timestamp("2023-03-01")
end_date = pd.Timestamp.today()

daily = (
    calls.groupby(["contract_identifier", pd.Grouper(key="timestamp", freq="D")])
    .size()
    .unstack("contract_identifier", fill_value=0)
    .fillna(0)
    .astype(int)
)

ax = daily.plot(kind="bar", stacked=True, figsize=(20, 7))

category_sums = daily.sum()
ax.legend(
    labels=[f"{category}: {category_sums[category]}" for category in daily.columns],
    loc="upper left",
    bbox_to_anchor=(0, 1),
)
x_labels = [d.date().strftime("%m-%d") for d in daily.index[::10]]
ax.set_xticks(range(0, len(daily), 10))
ax.set_xticklabels(x_labels, size=6)
ax.set_axisbelow(True)
ax.grid(axis="y", linestyle="--", color="grey")
ax.set_xlabel("Date")
ax.set_ylabel("New sheets")
ax.set_title(f"Total: {daily.sum().sum()}")
plt.tight_layout()
plt.savefig("daily_sheets.png")


# %% Plot cumsum
plt.clf()
ax = daily.sort_index().cumsum().plot.area(grid=True, alpha=0.85)
for line in ax.lines:
    line.set_linewidth(0)
handles, _ = ax.get_legend_handles_labels()
ax.legend(
    handles,
    [f"{category}: {category_sums[category]}" for category in daily.columns],
    loc="upper left",
    bbox_to_anchor=(0, 1),
)
ax.set_title(f"Total: {daily.sum().sum()}")
plt.tight_layout()
plt.savefig("cumsum_sheets.png", dpi=300)


# %% Plot monthly
plt.clf()
monthly = (
    calls.groupby(["contract_identifier", pd.Grouper(key="timestamp", freq="M")])
    .size()
    .unstack("contract_identifier", fill_value=0)
    .fillna(0)
    .astype(int)
)
ax = monthly.plot(kind="bar", stacked=True)
x_labels = [d.date().strftime("%Y-%m") for d in monthly.index]
ax.set_xticklabels(x_labels)
ax.grid(axis="y", linestyle="--", color="grey")
ax.legend(
    labels=[
        f"{category}: {category_sum}"
        for category, category_sum in category_sums.items()
    ],
    loc="upper left",
    bbox_to_anchor=(0, 1),
)
ax.set_title(f"Total: {monthly.sum().sum()}")
plt.tight_layout()
plt.savefig("monthly_sheets.png", dpi=300)

# %% Plot hourly sheet creation
plt.clf()
ax = (
    calls.timestamp.dt.strftime("%H")
    .value_counts()
    .sort_index()
    .plot.bar(xlabel="Hour")
)
plt.tight_layout()
plt.savefig("hourly_sheets.png")

# %% Users wallets
plt.clf()
ax = (
    calls.groupby(["class_hash", pd.Grouper(key="timestamp", freq="D")])
    .size()
    .unstack("class_hash", fill_value=0)
    .fillna(0)
    .astype(int)
    .sort_index()
    .cumsum()
    .transform(lambda row: row / row.sum(), axis=1)
    .plot.area()
)
plt.tight_layout()
plt.savefig("wallets.png", dpi=300)
