const fs = require("fs");
const path = require("path");

const divRegex = / +"__main__\.DIV_VALUE": {\n.*\n.*"value": ([0-9]+)\n +},/;
const prodRegex = / +"__main__\.PROD_VALUE": {\n.*\n.*"value": ([0-9]+)\n +},/;
const subRegex = / +"__main__\.SUB_VALUE": {\n.*\n.*"value": ([0-9]+)\n +},/;
const sumRegex = / +"__main__\.SUM_VALUE": {\n.*\n.*"value": ([0-9]+)\n +},/;

async function run() {
  const contractDeployData = fs.readFileSync(
    path.join(__dirname, "../starksheet-cairo/goerli.deployments.txt"),
    "utf8"
  );

  const address = contractDeployData.split(":")[0];

  const abiData = fs.readFileSync(
    path.join(__dirname, "../starksheet-cairo/artifacts/abis/Starksheet.json"),
    "utf8"
  );

  const abi = JSON.parse(abiData);

  const constantsData = fs.readFileSync(
    path.join(__dirname, "../starksheet-cairo/artifacts/constants.json"),
    "utf8"
  );

  const operations = {
    SUM: constantsData.match(sumRegex)[1],
    MINUS: constantsData.match(subRegex)[1],
    DIVIDE: constantsData.match(divRegex)[1],
    PRODUCT: constantsData.match(prodRegex)[1],
  };

  const data = {
    address,
    operations,
    abi,
  };

  fs.writeFileSync(
    path.join(__dirname, "./src/contract.json"),
    JSON.stringify(data)
  );
}

run().then(() => console.log("DONE"));
