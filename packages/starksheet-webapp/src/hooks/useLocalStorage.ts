import { useCallback, useState } from "react";
import { CellSettings } from "../types";

export function useLocalStorage(key: string, initialState: CellSettings) {
  const serializedInitialState =
    localStorage.getItem(key) ?? JSON.stringify(initialState);
  localStorage.setItem(key, serializedInitialState);
  const storageValue = JSON.parse(serializedInitialState);

  const [value, setValue] = useState(storageValue);

  const updatedSetValue = useCallback(
    (newValue: CellSettings) => {
      const serializedNewValue = JSON.stringify(newValue);
      if (
        serializedNewValue === serializedInitialState ||
        typeof newValue === "undefined"
      ) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, serializedNewValue);
      }
      setValue(newValue ?? initialState);
    },
    [initialState, serializedInitialState, key]
  );
  return [value, updatedSetValue];
}
