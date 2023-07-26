const fs = require("fs");
const path = require("path");

// Directory path
const starksheetCairoPath = path.join(__dirname, "./../../starksheet-cairo");
const starksheetDeploymentsFolder = path.join(
  starksheetCairoPath,
  "deployments"
);

const evmsheetDirectoryPath = path.join(
  __dirname,
  "./../../starksheet-solidity"
);
const evmsheetDeploymentsFolder = path.join(
  evmsheetDirectoryPath,
  "broadcast/Evmsheet.s.sol"
);

const evmChains = {
  5: "goerli",
  31337: "anvil",
  1263227476: "kakarot",
};

const contractData = {};
let errorFiles = 0;
let processedFiles = 0;

// Read directory
const readStarksheet = () => {
  let files;
  try {
    files = fs.readdirSync(starksheetDeploymentsFolder);
  } catch (error) {
    console.log("❌ Failed to read", starksheetDeploymentsFolder);
    return;
  }

  // Iterate through each directory
  files.forEach((folder) => {
    const filePath = path.join(
      starksheetDeploymentsFolder,
      folder,
      "deployments.json"
    );
    console.log(`Reading folder ${folder}`);

    // Read deployments.json file
    const data = fs.readFileSync(filePath, "utf8");

    try {
      const deployments = JSON.parse(data);
      contractData[folder] = {
        addresses: {},
        deployedAbis: {},
      };
      for (const contractName in deployments) {
        console.log(`Reading contract ${contractName}`);
        const contractDeployment = deployments[contractName];
        const contractAddress = contractDeployment.address;
        const contractAbi = JSON.parse(
          fs.readFileSync(
            path.join(starksheetCairoPath, contractDeployment.artifact)
          )
        ).abi;
        contractData[folder].addresses[
          contractName.toLowerCase().replace("starksheet", "spreadsheet")
        ] = contractAddress;
        contractData[folder].deployedAbis[contractAddress] = contractAbi;
      }
    } catch (error) {
      console.error(`Error parsing deployments.json in ${folder}:`, error);
    }
  });
};

// Read Evmsheet.s.sol directory
const readEvmsheet = () => {
  let subdirectories;
  try {
    subdirectories = fs.readdirSync(evmsheetDeploymentsFolder);
  } catch (error) {
    console.log("❌ Failed to read", evmsheetDeploymentsFolder);
    return;
  }

  // Iterate through each subdirectory in Evmsheet.s.sol directory
  subdirectories.forEach((subdirectory) => {
    const subdirectoryPath = path.join(evmsheetDeploymentsFolder, subdirectory);

    console.log(`Reading folder ${subdirectory}`);
    const networkName = evmChains[subdirectory];

    if (networkName === undefined) {
      throw new Error(`Unknown chainId ${subdirectory}`);
    }

    if (subdirectoryPath.includes("dry-run")) {
      console.log(`Dry-run: skipping`);
      return;
    }

    // Read subdirectory
    const files = fs.readdirSync(subdirectoryPath);
    const runLatestFiles = files.filter((file) =>
      file.startsWith("run-latest")
    );
    if (runLatestFiles.length !== 1) {
      throw new Error(
        `Expected one run-latest.json file, found ${runLatestFiles.length}`
      );
    }

    const filePath = path.join(subdirectoryPath, runLatestFiles[0]);
    console.log(`Reading ${filePath}`);

    // Read run-latest.json file
    const data = fs.readFileSync(filePath, "utf8");
    try {
      const runLatestData = JSON.parse(data);
      const transactions = runLatestData.transactions;

      transactions.forEach((transaction) => {
        const contractName = transaction.contractName || "Math";
        const contractAddress = transaction.contractAddress;
        const contractAbi = JSON.parse(
          fs.readFileSync(
            path.join(
              evmsheetDirectoryPath,
              `out/${contractName}.sol/${contractName}.json`
            )
          )
        ).abi;

        if (!contractData[networkName]) {
          contractData[networkName] = {
            addresses: {},
            deployedAbis: {},
          };
        }
        contractData[networkName].addresses[
          contractName
            .replace("Evmsheet", "spreadsheet")
            .replace("MultiSendCallOnly", "multisend")
            .toLowerCase()
        ] = contractAddress;
        contractData[networkName].deployedAbis[contractAddress] = contractAbi;
      });
      processedFiles = processedFiles + 1;
    } catch (error) {
      console.error(`Error parsing ${filePath}: ${error}`);
      errorFiles = errorFiles + 1;
    }
  });
};

readEvmsheet();
readStarksheet();

// Merge starksheetAddresses and evmsheetAddresses
console.log(`Network found: ${Object.keys(contractData)}`);
process.env.REACT_APP_NETWORK
  ? console.log(`Building for network ${process.env.REACT_APP_NETWORK}`)
  : console.log("No specific network, exporting all");
if (
  process.env.REACT_APP_NETWORK &&
  !contractData[process.env.REACT_APP_NETWORK]
) {
  throw new Error(`No data for network ${process.env.REACT_APP_NETWORK}`);
}

let starknetAbis = {
  spreadsheet: {},
  worksheet: {},
};
try {
  starknetAbis = {
    spreadsheet: JSON.parse(
      fs.readFileSync(path.join(starksheetCairoPath, "build/Starksheet.json"))
    ).abi,
    worksheet: JSON.parse(
      fs.readFileSync(path.join(starksheetCairoPath, "build/Sheet.json"))
    ).abi,
  };
} catch (error) {
  console.log("❌ No ABIs for Starknet networks");
}

let evmAbis = {
  spreadsheet: {},
  worksheet: {},
};
try {
  evmAbis = {
    spreadsheet: JSON.parse(
      fs.readFileSync(
        path.join(evmsheetDirectoryPath, "out/Evmsheet.sol/Evmsheet.json")
      )
    ).abi,
    worksheet: JSON.parse(
      fs.readFileSync(
        path.join(evmsheetDirectoryPath, "out/Sheet.sol/Sheet.json")
      )
    ).abi,
  };
} catch (error) {
  console.log("❌ No ABIs for Evm networks");
}
const mergedAddresses = {
  network: process.env.REACT_APP_NETWORK
    ? contractData[process.env.REACT_APP_NETWORK]
    : contractData,

  abis: {
    starknet: starknetAbis,
    eth: evmAbis,
  },
};

const contractDataFilePath = path.join(
  __dirname,
  "../src/contracts/contractData.json"
);

console.log(mergedAddresses.network.addresses);

// Write the JSON data to the contractDataFilePath
fs.writeFileSync(
  contractDataFilePath,
  JSON.stringify(mergedAddresses, null, 2),
  "utf8",
  (err) => {
    if (err) {
      console.error("Error writing to contractData.json:", err);
      return;
    }

    console.log("contractData.json file created successfully!");
  }
);
