import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// TODO: load env vars (PRIVATE_KEY, MONAD_RPC_URL) via dotenv once secrets are set
// TODO: add Monad testnet network entry, e.g.:
//   monadTestnet: {
//     url: process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz",
//     chainId: <monad-testnet-chain-id>,
//     accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
//   }
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
  },
};

export default config;
