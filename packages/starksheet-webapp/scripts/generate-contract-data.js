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

const spreadsheetAddresses = {};
const evmsheetAddresses = {};

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

    // Read deployments.json file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading deployments.json in ${folder}:`, err);
        return;
      }

      try {
        const deployments = JSON.parse(data);
        const starksheetAddress = deployments["Starksheet"].address;
        const mathAddress = deployments["math"].address;
        spreadsheetAddresses[folder] = {
          spreadsheet: starksheetAddress,
          math: mathAddress,
        };
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

      const runLatestFiles = files.filter((file) =>
        file.startsWith("run-latest")
      );

      runLatestFiles.forEach((file) => {
        const filePath = path.join(subdirectoryPath, file);

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
              const rpcUrl = new URL(transaction.rpc).hostname
                .replace("127.0.0.1", "anvil")
                .split(".")[0];

              if (!evmsheetAddresses[rpcUrl]) {
                evmsheetAddresses[rpcUrl] = {};
              }

              evmsheetAddresses[rpcUrl][contractName] = contractAddress;
            });

            // Check if all run-latest.json files have been processed
            const totalRunLatestFiles =
              subdirectories.length * runLatestFiles.length;
            const processedRunLatestFiles =
              Object.keys(evmsheetAddresses).length;
            if (processedRunLatestFiles === totalRunLatestFiles) {
              // Merge spreadsheetAddresses and evmsheetAddresses
              const mergedAddresses = {
                starknet: {
                  addresses: spreadsheetAddresses,
                  abis: {
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
                },
                eth: {
                  addresses: evmsheetAddresses,
                  abis: {
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
          } catch (error) {
            console.error(`Error parsing ${file}:`, error);
          }
        });
      });
    });
  });
});
