const starknet = require("starknet");

const starknetRpcProvider = new starknet.RpcProvider({
  nodeUrl:
    "https://starknet-goerli.infura.io/v3/a90ef760714c4c8e950ea7cfb1f32548",
});

async function run() {
  const events = await starknetRpcProvider.getEvents({
    fromBlock: { block_number: 371600 },
    address:
      "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    page_size: 1000,
    page_number: 0,
  });
  fs.writeFileSync(
    path.join(__dirname, "./tmp/events.json"),
    JSON.stringify(events, null, 2)
  );
}

run().then(() => console.log("DONE"));
