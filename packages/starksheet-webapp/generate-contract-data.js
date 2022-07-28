const fs = require("fs");
const path = require("path");

const network = process.env.REACT_APP_NETWORK;

async function run() {
  const contractDeployData = fs.readFileSync(
    path.join(__dirname, `../starksheet-cairo/${network}.deployments.txt`),
    "utf8"
  );

  const mathContractData = contractDeployData.split("\n")[0];
  const starkSheetContractData = contractDeployData.split("\n")[1];
  const mathAddress = mathContractData.split(":")[0];
  const starkSheetAddress = starkSheetContractData.split(":")[0];

  const abiData = fs.readFileSync(
    path.join(__dirname, "../starksheet-cairo/artifacts/abis/Starksheet.json"),
    "utf8"
  );

  const abi = JSON.parse(abiData);

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
    abi,
    allowlist,
  };

  fs.writeFileSync(
    path.join(__dirname, "./src/contract.json"),
    JSON.stringify(data)
  );
}

run().then(() => console.log("DONE"));
