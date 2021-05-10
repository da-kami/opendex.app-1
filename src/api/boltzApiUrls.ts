import { Network } from '../context/NetworkContext';

const getBoltzAPIurl = (network: Network) => {
  switch (network) {
    case Network.Mainnet:
      return process.env.REACT_APP_BOLTZ_MAINNET_API;
    case Network.Testnet:
      return process.env.REACT_APP_BOLTZ_TESTNET_API;
    default:
      return process.env.REACT_APP_BOLTZ_REGTEST_API;
  }
};

export const BOLTZ_GET_PAIRS_API_URL = (network: Network) =>
  `${getBoltzAPIurl(network)}/getpairs`;
export const BOLTZ_GET_CONTRACTS_API_URL = (network: Network) =>
  `${getBoltzAPIurl(network)}/getcontracts`;
export const BOLTZ_CREATE_SWAP_API_URL = (network: Network) =>
  `${getBoltzAPIurl(network)}/createSwap`;
export const BOLTZ_STREAM_SWAP_STATUS_API_URL = (network: Network) =>
  `${getBoltzAPIurl(network)}/streamswapstatus`;
export const BOLTZ_SWAP_STATUS_API_URL = (network: Network) =>
  `${getBoltzAPIurl(network)}/swapstatus`;
export const BOLTZ_GET_SWAP_TRANSACTION_API_URL = (network: Network) =>
  `${getBoltzAPIurl(network)}/getswaptransaction`;
export const BOLTZ_GET_FEE_ESTIMATION_API_URL = (network: Network) =>
  `${getBoltzAPIurl(network)}/getfeeestimation`;
export const BOLTZ_BROADCAST_TRANSACTION_API_URL = (network: Network) =>
  `${getBoltzAPIurl(network)}/broadcasttransaction`;
