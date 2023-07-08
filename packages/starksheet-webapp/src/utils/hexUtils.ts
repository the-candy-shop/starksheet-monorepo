import BN from "bn.js";
import { BigNumber } from "ethers";
import { number } from "starknet";

export function hex2str(hex: string): string {
  return (hex.match(/[a-f0-9]{2}/g) || [])
    .map((byte) => String.fromCharCode(parseInt(byte, 16)))
    .join("");
}

export const str2hex = (s: string) =>
  "0x" +
  Array.from(Array(s.length).keys())
    .map((i) => s.charCodeAt(i).toString(16))
    .join("");

export function isASCII(s: string) {
  return /^[\x20-\x7e]*$/.test(s);
}

export const normalizeHexString = (address: string) =>
  !!address ? "0x" + number.toBN(address).toString(16) : "";

export const bn2hex = (hex: BN): string => "0x" + hex.toString(16);

export const bn2bytes =
  (n: number) =>
  (hex: BN): string =>
    hex.toString(16).padEnd(n * 2, "0");

export const bn2uint =
  (n: number) =>
  (hex: BN): string =>
    hex.toString(16).padStart(n * 2, "0");

export const ethersHexStringToBN = (hexstring: string) =>
  new BN(BigNumber.from(hexstring).toString());

export function hexStringToIntegerArray(hexString: string) {
  // Remove any non-hex characters
  hexString = hexString.replace(/[^0-9a-fA-F]/g, "");

  // Split the hex string into pairs of two characters
  const hexPairs = hexString.match(/.{1,64}/g);

  if (!hexPairs) {
    return [];
  }

  // Convert each pair to an integer and store it in a new array
  const integerArray = Array.from(
    hexPairs,
    (pair) => new BN(parseInt(pair, 16))
  );

  return integerArray;
}
