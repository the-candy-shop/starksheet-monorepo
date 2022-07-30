const fs = require("fs");
const path = require("path");

const network = process.env.REACT_APP_NETWORK;

async function run() {
  const contractDeployData = fs.readFileSync(
    path.join(__dirname, `../starksheet-cairo/${network}.deployments.txt`),
    "utf8"
  );

  const splittedDeployedData = contractDeployData.split("\n");

  const mathContractData = splittedDeployedData.find((data) =>
    data.includes(":math")
  );

  const starkSheetContractData = splittedDeployedData.find((data) =>
    data.includes(":starksheet")
  );

  const mathAddress = mathContractData.split(":")[0];
  const starkSheetAddress = starkSheetContractData.split(":")[0];

  const starkSheetAbiData = fs.readFileSync(
    path.join(__dirname, "../starksheet-cairo/artifacts/abis/Starksheet.json"),
    "utf8"
  );

  const starkSheetAbi = JSON.parse(starkSheetAbiData);

  const sheetAbiData = fs.readFileSync(
    path.join(__dirname, "../starksheet-cairo/artifacts/abis/Sheet.json"),
    "utf8"
  );

  const sheetAbi = JSON.parse(sheetAbiData);

  const constantsData = fs.readFileSync(
    path.join(__dirname, "../starksheet-cairo/selectors.json"),
    "utf8"
  );

  const constants = JSON.parse(constantsData);

  const operations = {
    SUM: constants.sum,
    MINUS: constants.sub,
    DIVIDE: constants.div,
    PRODUCT: constants.prod,
  };

  const allowlistData = fs.readFileSync(
    path.join(__dirname, "../starksheet-cairo/allow_list.json"),
    "utf8"
  );

  const allowlist = JSON.parse(allowlistData);

  const data = {
    address: starkSheetAddress,
    mathAddress: mathAddress,
    operations,
    starkSheetAbi,
    sheetAbi,
    allowlist,
  };

  fs.writeFileSync(
    path.join(__dirname, "./src/contract.json"),
    JSON.stringify(data)
  );
}

run().then(() => console.log("DONE"));
