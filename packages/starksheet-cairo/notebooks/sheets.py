# %% Imports and query
import logging
from pathlib import Path

import pandas as pd
import requests

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
data = {
    "query": """query AccountCallsTablePaginationFragment(
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
                        id
                        ...AccountCallsTableRowFragment_call
                        __typename
                      }
                      cursor
                    }
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                  }
                }
                fragment AccountCallsTableRowFragment_call on Call {
                  call_id
                  block_number
                  transaction_hash
                  selector
                  contract_address
                  contract_identifier
                  contract {
                    is_social_verified
                    id
                  }
                  timestamp
                  selector_name
                  selector_identifier
                  calldata_decoded
                  calldata
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
            "order_by": "desc",
            "sort_by": "timestamp",
        },
    },
}

# %% Fetch data
# if Path("calls.csv").is_file():
#     previous_calls = pd.read_csv("calls.csv")
#     after = (
#         previous_calls.sort_values("timestamp", ascending=True)
#         .drop_duplicates("contract_address")
#         .set_index("contract_address")
#         .cursor.to_dict()
#     )
# else:
after = {}
previous_calls = pd.DataFrame()


calls = []
for contract_address in [
    "0x076a028b19d27310f5e9f941041ae4a3a52c0e0024d593ddcb0d34e1dcd24af1",
    "0x071d48483dcfa86718a717f57cf99a72ff8198b4538a6edccd955312fe624747",
]:
    # data["variables"]["after"] = after.get(contract_address)
    data["variables"]["input"]["contract_address"] = contract_address
    response = requests.post(url, headers=headers, json=data)
    calls += response.json()["data"]["calls"]["edges"]


calls = (
    pd.concat(
        [
            pd.DataFrame(
                [{**call["node"], "cursor": call["cursor"]} for call in calls]
            ),
            previous_calls,
        ]
    )
    .loc[lambda df: df.selector_name == "addSheet"]
    .filter(items=["contract_address", "timestamp", "cursor", "selector_name"])
)

calls.to_csv("calls.csv", index=False)

# %% Plot daily sheet creation
ts = calls.timestamp.astype("datetime64[s]").value_counts().resample("D").sum()
ax = ts.plot.bar()

x_labels = [d.date().strftime("%Y-%m-%d") for d in ts.index]
ax.set_xticks(range(len(ts)))
ax.set_xticklabels(x_labels, rotation=45, ha="right")
ax.set_axisbelow(True)
ax.grid(axis="y", linestyle="--", color="grey")
ax.set_xlabel("Date")
ax.set_ylabel("New sheets")
ax.set_title(f"Total: {ts.sum()}")
logger.info(f"📈 sheets: {ts.sum()}")

# %% Plot hourly sheet creation
(
    calls.timestamp.astype("datetime64[s]")
    .dt.strftime("%H")
    .value_counts()
    .sort_index()
    .plot.bar(xlabel="Hour")
)
