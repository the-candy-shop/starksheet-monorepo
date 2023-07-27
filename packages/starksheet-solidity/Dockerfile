FROM ghcr.io/foundry-rs/foundry

WORKDIR /app/starksheet
COPY .git .git
COPY .gitmodules .gitmodules
COPY ./packages/starksheet-solidity ./packages/starksheet-solidity

WORKDIR /app/starksheet/packages/starksheet-solidity
ENV ETHERSCAN_API_KEY=
ENV FOUNDRY_PROFILE=docker

RUN forge build --names --force

ENTRYPOINT [ "forge" ]
CMD ["script", "script/Evmsheet.s.sol", "--broadcast"]
