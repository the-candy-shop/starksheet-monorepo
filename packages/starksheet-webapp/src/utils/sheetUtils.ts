const generateColumnName = (columnIndex: number): string => {
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
