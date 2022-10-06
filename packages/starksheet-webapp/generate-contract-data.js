const fs = require("fs");
const path = require("path");

const network =
  process.env.REACT_APP_NETWORK === "SN_MAIN"
    ? "alpha-mainnet"
    : "alpha-goerli";

async function run() {
  const contractDeployData = require(`../starksheet-cairo/${network}.deployments.json`);

  const address = contractDeployData["Starksheet"]["address"];
  const starkSheetAbi =
    require(`../starksheet-cairo/${contractDeployData["Starksheet"]["artifact"]}`)[
      "abi"
    ];
  const sheetAbi = require("../starksheet-cairo/artifacts/abis/Sheet.json");
  const allowlist = require("../starksheet-cairo/allow_list.json");

  const contractAbis = Object.values(contractDeployData).reduce(
    (prev, cur) => ({
      ...prev,
      ["0x" + BigInt(cur.address).toString(16)]:
        require(`../starksheet-cairo/${cur.artifact}`)["abi"],
    }),
    {}
  );

  const data = {
    address,
    starkSheetAbi,
    sheetAbi,
    allowlist,
    contractAbis,
  };

  fs.writeFileSync(
    path.join(__dirname, "./src/contract.json"),
    JSON.stringify(data, null, 2)
  );
}

run().then(() => console.log("DONE"));
