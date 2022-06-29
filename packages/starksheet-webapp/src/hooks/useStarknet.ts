import React from "react";
import { StarknetContext } from "../contexts/StarknetContext";
import { connect as starknetConnect } from "@argent/get-starknet";

export const useStarknet = () => {
  const { starknet, setStarknet } = React.useContext(StarknetContext);

  const connect = React.useCallback(async () => {
    if (!starknet) {
      const starknetInstance = await starknetConnect();
      if (starknetInstance) {
        await starknetInstance.enable();
        setStarknet(starknetInstance);
      }
    }
  }, [setStarknet, starknet]);

  return { starknet, connect };
};
