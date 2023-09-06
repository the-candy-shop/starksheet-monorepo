# %% Imports and query
import logging

import matplotlib.pyplot as plt
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
_calls = []
for contract_address in [
    "0x028850a764600d53b2009b17428ae9eb980a4c4ea930a69ed8668048ef082a04",
    "0x076a028b19d27310f5e9f941041ae4a3a52c0e0024d593ddcb0d34e1dcd24af1",
    "0x071d48483dcfa86718a717f57cf99a72ff8198b4538a6edccd955312fe624747",
]:
    page = 0
    data["variables"]["after"] = None
    data["variables"]["input"]["contract_address"] = contract_address
    response = requests.post(url, headers=headers, json=data)
    _calls += response.json()["data"]["calls"]["edges"]
    while response.json()["data"]["calls"]["pageInfo"]["hasNextPage"]:
        page += 1
        logger.info(f"⏳ contract {contract_address}: fetching page {page}")
        data["variables"]["after"] = response.json()["data"]["calls"]["pageInfo"][
            "endCursor"
        ]
        response = requests.post(url, headers=headers, json=data)
        _calls += response.json()["data"]["calls"]["edges"]


calls = (
    pd.DataFrame([call["node"] for call in _calls])
    .loc[lambda df: df.selector_name == "addSheet"]
    .astype({"timestamp": "datetime64[s]"})
    .assign(
        contract_identifier=lambda df: df.contract_identifier.str.extract(r"(v\d+)")
    )
)

calls.to_csv("calls.csv", index=False)

# %% Plot daily sheet creation
# define the date range for the plot
start_date = pd.Timestamp("2023-03-01")
end_date = pd.Timestamp.today()
date_range = pd.date_range(start_date, end_date, freq="D")

counts = (
    calls.groupby(["contract_identifier", pd.Grouper(key="timestamp", freq="D")])
    .size()
    .unstack("contract_identifier", fill_value=0)
    .reindex(date_range)
    .fillna(0)
    .astype(int)
)

ax = counts.plot(kind="bar", stacked=True)

x_labels = [d.date().strftime("%m-%d") for d in counts.index]
category_sums = counts.sum()
ax.legend(
    labels=[f"{category}: {category_sums[category]}" for category in counts.columns],
    loc="upper left",
    bbox_to_anchor=(0, 1),
)
ax.set_xticks(range(len(counts)))
ax.set_xticklabels(x_labels, size=6)
ax.set_axisbelow(True)
ax.grid(axis="y", linestyle="--", color="grey")
ax.set_xlabel("Date")
ax.set_ylabel("New sheets")
ax.set_title(f"Total: {counts.sum().sum()}")
logger.info(f"📈 sheets: {counts.sum().sum()}")
plt.tight_layout()
plt.savefig("daily_sheets.png")

# %% Plot monthly
counts = (
    calls.groupby(["contract_identifier", pd.Grouper(key="timestamp", freq="M")])
    .size()
    .unstack("contract_identifier", fill_value=0)
    .fillna(0)
    .astype(int)
)
ax = counts.plot(kind="bar", stacked=True)
x_labels = [d.date().strftime("%Y-%m") for d in counts.index]
ax.set_xticklabels(x_labels)
ax.grid(axis="y", linestyle="--", color="grey")
plt.tight_layout()
plt.savefig("monthly_sheets.png")

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

# %% Plot cumsum
plt.clf()
ax = counts.cumsum().plot.area(grid=True)
plt.tight_layout()
plt.savefig("cumsum_sheets.png")
