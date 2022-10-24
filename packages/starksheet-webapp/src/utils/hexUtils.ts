import BN from "bn.js";
import { toBN } from "starknet/utils/number";

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
  !!address ? "0x" + toBN(address).toString(16) : "";

export const bn2hex = (hex: BN): string => "0x" + hex.toString(16);
