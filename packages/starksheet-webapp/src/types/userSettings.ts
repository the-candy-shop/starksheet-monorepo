export type CellSettings = {
  text?: boolean;
};

export type UserSettings = {
  [key: string]: CellSettings;
};
