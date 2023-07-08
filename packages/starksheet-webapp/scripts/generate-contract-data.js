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

const contractData = {};
let errorFiles = 0;
let processedFiles = 0;

// Read directory
fs.readdir(starksheetDeploymentsFolder, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
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
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading deployments.json for ${folder}`);
        return;
      }

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
  });
});

// Read Evmsheet.s.sol directory
fs.readdir(evmsheetDeploymentsFolder, (err, subdirectories) => {
  if (err) {
    console.error("Error reading Evmsheet.s.sol directory:", err);
    return;
  }

  // Iterate through each subdirectory in Evmsheet.s.sol directory
  subdirectories.forEach((subdirectory) => {
    const subdirectoryPath = path.join(evmsheetDeploymentsFolder, subdirectory);

    // Read subdirectory
    fs.readdir(subdirectoryPath, (err, files) => {
      if (err) {
        console.error(`Error reading ${subdirectory} directory:`, err);
        return;
      }

      console.log(`Reading ${subdirectoryPath}`);
      if (subdirectoryPath.includes("dry-run")) {
        console.log(`Dry-run: skipping`);
        return;
      }

      const runLatestFiles = files.filter((file) =>
        file.startsWith("run-latest")
      );
      console.log(`Files: ${runLatestFiles}`);

      runLatestFiles.forEach((file) => {
        const filePath = path.join(subdirectoryPath, file);
        console.log(`Reading : ${filePath}`);

        // Read run-latest.json file
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
            console.error(`Error reading ${file}:`, err);
            return;
          }

          try {
            const runLatestData = JSON.parse(data);
            const transactions = runLatestData.transactions;

            transactions.forEach((transaction) => {
              const contractName = transaction.contractName || "Math";
              const contractAddress = transaction.contractAddress;
              const rpcUrl = transaction.rpc
                ? new URL(transaction.rpc).hostname
                    .replace("127.0.0.1", "anvil")
                    .split(".")[0]
                : "anvil";

              const contractAbi = JSON.parse(
                fs.readFileSync(
                  path.join(
                    evmsheetDirectoryPath,
                    `out/${contractName}.sol/${contractName}.json`
                  )
                )
              ).abi;

              if (!contractData[rpcUrl]) {
                contractData[rpcUrl] = {
                  addresses: {},
                  deployedAbis: {},
                };
              }
              contractData[rpcUrl].addresses[
                contractName
                  .replace("Evmsheet", "spreadsheet")
                  .replace("MultiSendCallOnly", "multisend")
                  .toLowerCase()
              ] = contractAddress;
              contractData[rpcUrl].deployedAbis[contractAddress] = contractAbi;
            });
            processedFiles = processedFiles + 1;
          } catch (error) {
            console.error(`Error parsing ${file}:`);
            errorFiles = errorFiles + 1;
          } finally {
            // Check if all run-latest.json files have been processed
            const totalRunLatestFiles =
              subdirectories.length * runLatestFiles.length;
            if (processedFiles + errorFiles === totalRunLatestFiles) {
              // Merge starksheetAddresses and evmsheetAddresses
              const mergedAddresses = {
                network: process.env.REACT_APP_NETWORK
                  ? contractData[process.env.REACT_APP_NETWORK]
                  : contractData,
                abis: {
                  starknet: {
                    spreadsheet: JSON.parse(
                      fs.readFileSync(
                        path.join(starksheetCairoPath, "build/Starksheet.json")
                      )
                    ).abi,
                    worksheet: JSON.parse(
                      fs.readFileSync(
                        path.join(starksheetCairoPath, "build/Sheet.json")
                      )
                    ).abi,
                  },
                  eth: {
                    spreadsheet: JSON.parse(
                      fs.readFileSync(
                        path.join(
                          evmsheetDirectoryPath,
                          "out/Evmsheet.sol/Evmsheet.json"
                        )
                      )
                    ).abi,
                    worksheet: JSON.parse(
                      fs.readFileSync(
                        path.join(
                          evmsheetDirectoryPath,
                          "out/Sheet.sol/Sheet.json"
                        )
                      )
                    ).abi,
                  },
                },
              };

              const contractDataFilePath = path.join(
                __dirname,
                "../src/contracts/contractData.json"
              );

              // if (process.env.REACT_APP_NETWORK) {
              //   mergedAddresses = {};
              // }
              // Convert the mergedAddresses object to JSON
              const contractDataJson = JSON.stringify(mergedAddresses, null, 2);

              // Write the JSON data to the contractDataFilePath
              fs.writeFile(
                contractDataFilePath,
                contractDataJson,
                "utf8",
                (err) => {
                  if (err) {
                    console.error("Error writing to contractData.json:", err);
                    return;
                  }

                  console.log("contractData.json file created successfully!");
                }
              );
            }
          }
        });
      });
    });
  });
});
