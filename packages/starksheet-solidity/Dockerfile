FROM ghcr.io/foundry-rs/foundry

WORKDIR /app/starksheet/packages/starksheet-solidity
COPY . .
ENV ETHERSCAN_API_KEY=
ENV FOUNDRY_PROFILE=docker

ENTRYPOINT [ "forge" ]
CMD ["script", "script/Evmsheet.s.sol", "--broadcast"]
