import BN from "bn.js";
import { RC_BOUND } from "./constants";

export const getColumnIndexFromName = (columnName: string): number => {
  let base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    i,
    j,
    result = 0;

  for (
    i = 0, j = columnName.length - 1;
    i < columnName.length;
    i += 1, j -= 1
  ) {
    result += Math.pow(base.length, j) * (base.indexOf(columnName[i]) + 1);
  }

  return result - 1;
};

export const generateColumnName = (columnIndex: number): string => {
  let letters = "";
  while (columnIndex >= 0) {
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[columnIndex % 26] + letters;
    columnIndex = Math.floor(columnIndex / 26) - 1;
  }
  return letters;
};

export const generateColumnNames = (columns: number): string[] => {
  const result = [];

  for (let i = 0; i < columns; i++) {
    result.push(generateColumnName(i));
  }

  return result;
};

export const generateRowNames = (rows: number): string[] => {
  const result = [];

  for (let i = 0; i < rows; i++) {
    result.push((i + 1).toString());
  }

  return result;
};

export const getRightCellName = (
  cellName: string,
  maxColumnIndex: number
): string => {
  const split = cellName.match(/([A-Z]+)(\d+)/);

  if (!split) return cellName;

  const columnName = split[1];
  const columnIndex = getColumnIndexFromName(columnName);
  const rowName = split[2];

  if (columnIndex + 1 < maxColumnIndex) {
    return `${generateColumnName(columnIndex + 1)}${rowName}`;
  } else {
    return cellName;
  }
};

export const getLeftCellName = (cellName: string): string => {
  const split = cellName.match(/([A-Z]+)(\d+)/);

  if (!split) return cellName;

  const columnName = split[1];
  const columnIndex = getColumnIndexFromName(columnName);
  const rowName = split[2];

  if (columnIndex - 1 >= 0) {
    return `${generateColumnName(columnIndex - 1)}${rowName}`;
  } else {
    return cellName;
  }
};

export const getTopCellName = (cellName: string): string => {
  const split = cellName.match(/([A-Z]+)(\d+)/);

  if (!split) return cellName;

  const columnName = split[1];
  const rowIndex = parseInt(split[2]);

  if (rowIndex - 1 >= 1) {
    return `${columnName}${rowIndex - 1}`;
  } else {
    return cellName;
  }
};

export const getBottomCellName = (
  cellName: string,
  maxRowIndex: number
): string => {
  const split = cellName.match(/([A-Z]+)(\d+)/);

  if (!split) return cellName;

  const columnName = split[1];
  const rowIndex = parseInt(split[2]);

  if (rowIndex + 1 <= maxRowIndex) {
    return `${columnName}${rowIndex + 1}`;
  } else {
    return cellName;
  }
};

export const resolveContractAddress = (values: BN[], contractAddress: BN) => {
  return contractAddress.lt(RC_BOUND)
    ? values[contractAddress.toNumber()]
    : contractAddress;
};
