import "dotenv/config";

export function node_url(networkName: string): string {
  if (networkName) {
    const uri = process.env["ETH_NODE_URI_" + networkName.toUpperCase()];
    if (uri && uri !== "") {
      return uri;
    }
  }

  let uri = process.env.ETH_NODE_URI;
  if (uri) {
    uri = uri.replace("{{networkName}}", networkName);
  }
  if (!uri || uri === "") {
    if (networkName === "localhost") {
      return "http://localhost:8545";
    }
    return "";
  }
  if (uri.indexOf("{{") >= 0) {
    throw new Error(
      `invalid uri or network not supported by node provider : ${uri}`
    );
  }
  return uri;
}

export function getMnemonic(networkName?: string): string {
  if (networkName) {
    const mnemonic = process.env["MNEMONIC_" + networkName.toUpperCase()];
    if (mnemonic && mnemonic !== "") {
      return mnemonic;
    }
  }

  return process.env.MNEMONIC || "";
}

export function getPrivateKeys(networkName?: string): string[] {
  if (networkName) {
    const privateKey = process.env["PRIVATE_KEY_" + networkName.toUpperCase()];
    if (privateKey && privateKey !== "") {
      return privateKey.split(",");
    }
  }

  return (process.env.PRIVATE_KEY || "").split(",");
}

export function accounts(
  networkName?: string
): { mnemonic: string } | string[] {
  const mnemonic = getMnemonic(networkName);
  const privateKey = getPrivateKeys(networkName);
  if (mnemonic && mnemonic !== "") {
    return { mnemonic: getMnemonic(networkName) };
  } else if (privateKey && privateKey.length > 0) {
    return privateKey;
  } else {
    throw new Error("no mnemonic or private key found");
  }
}
