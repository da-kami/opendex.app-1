import { Contract } from 'ethers';
import { Transaction, ECPair, address } from 'bitcoinjs-lib';
import {
  detectSwap,
  constructClaimTransaction,
  ContractABIs,
} from 'boltz-core';
import wait from '../../utils/wait';
import { GET_FEE_ESTIMATION } from '../../api/apiUrls';
import { createSwap } from '../submarine/submarineDuck';
import { CurrencyTypes } from '../../constants/submarine';
import { SwapUpdateEvent } from '../../constants/environment';
import { LocalStorageState } from '../../constants/environment';
import { formatTokenAmount } from '../../utils/ethereumDecimals';
import {
  getHexBuffer,
  getNetwork,
  broadcastRefund as broadcastClaimTransaction,
} from '../refund/refundDuck';

const SET_SWAP_DETAILS = 'SET_SWAP_DETAILS';
const REVERSE_SWAP_RESPONSE = 'SET_REVERSE_SWAP_RESPONSE';
const SET_REVERSE_SWAP_STATUS = 'SET_REVERSE_SWAP_STATUS';
const SET_ETHEREUM_PREPAY_MINER_FEE = 'SET_ETHEREUM_PREPAY_MINER_FEE';
const SET_ETHEREUM_PREPAY_MINER_FEE_PAID = 'SET_ETHEREUM_PREPAY_MINER_FEE_PAID';
const SET_CLAIM_TRANSACTION_ID = 'SET_TRANSACTION_ID';

export const RESET_STATE = 'RESET_STATE';

const activeSwap = localStorage.getItem(LocalStorageState.ActiveSwap);
const currentReverseState =
  activeSwap === 'reverse'
    ? JSON.parse(localStorage.getItem('currentReverseState'))
    : {};

const initialState = {
  ...{
    swapDetails: {},
    reverseSwapResponse: {},
    reverseSwapStatus: {},
    transactionId: '',
    ethereumPrepayMinerFee: false,
    ethereumPrepayMinerFeePaid: false,
  },
  ...currentReverseState,
};

/* Action Creators */
export const setSwapDetails = data => ({
  type: SET_SWAP_DETAILS,
  data,
});

export const reverseSwapResponse = data => ({
  type: REVERSE_SWAP_RESPONSE,
  data,
});

export const setReverseSwapStatus = status => ({
  type: SET_REVERSE_SWAP_STATUS,
  status,
});

export const resetState = () => ({
  type: RESET_STATE,
});

export const setEthereumPrepayMinerFee = data => ({
  type: SET_ETHEREUM_PREPAY_MINER_FEE,
  data,
});

export const setEthereumPrepayMinerFeePaid = data => ({
  type: SET_ETHEREUM_PREPAY_MINER_FEE_PAID,
  data,
});

export const setClaimTransactionId = data => ({
  type: SET_CLAIM_TRANSACTION_ID,
  data,
});

/* Reducers */

export const reverseReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SWAP_DETAILS:
      localStorage.setItem(
        LocalStorageState.CurrentReverseState,
        JSON.stringify({
          ...state,
          swapDetails: action.data,
        })
      );
      return {
        ...state,
        swapDetails: action.data,
      };

    case REVERSE_SWAP_RESPONSE:
      localStorage.setItem(
        LocalStorageState.CurrentReverseState,
        JSON.stringify({
          ...state,
          reverseSwapResponse: action.data,
        })
      );
      return {
        ...state,
        reverseSwapResponse: action.data,
      };

    case SET_CLAIM_TRANSACTION_ID:
      return {
        ...state,
        claimTransactionId: action.data,
      };

    case SET_ETHEREUM_PREPAY_MINER_FEE:
      return {
        ...state,
        ethereumPrepayMinerFee: action.data,
      };

    case SET_ETHEREUM_PREPAY_MINER_FEE_PAID:
      return {
        ...state,
        ethereumPrepayMinerFeePaid: action.data,
      };

    case RESET_STATE:
      localStorage.removeItem(LocalStorageState.ActiveSwap);
      localStorage.removeItem(LocalStorageState.ExtraDetails);
      localStorage.removeItem(LocalStorageState.CurrentReverseState);
      localStorage.removeItem(LocalStorageState.CurrentSubmarineState);

      return {
        ...initialState,
        ethereumPrepayMinerFee: false,
        ethereumPrepayMinerFeePaid: false,
      };

    default:
      return state;
  }
};

let latestSwapEvent = '';

export const getFeeEstimation = async () => {
  const data = await fetch(GET_FEE_ESTIMATION);
  return data.json();
};

const getClaimTransaction = (
  onchainCurrency,
  swapInfo,
  response,
  feeEstimation
) => {
  const redeemScript = getHexBuffer(response.redeemScript);
  const lockupTransaction = Transaction.fromHex(response.transactionHex);

  return constructClaimTransaction(
    [
      {
        ...detectSwap(redeemScript, lockupTransaction),
        redeemScript,
        txHash: lockupTransaction.getHash(),
        preimage: getHexBuffer(swapInfo.preImage),
        keys: ECPair.fromPrivateKey(getHexBuffer(swapInfo.privateKey)),
      },
    ],
    address.toOutputScript(swapInfo.address, getNetwork(onchainCurrency)),
    feeEstimation[onchainCurrency],
    false
  );
};

export const claimSwap = async (
  dispatch,
  nextStage,
  signer,
  swapInfo,
  swapResponse
) => {
  const submarineState = JSON.parse(
    localStorage.getItem(LocalStorageState.CurrentSubmarineState)
  );
  const receiveCurrency = submarineState.receiveCurrency;

  if (receiveCurrency.type !== CurrencyTypes.BitcoinLike) {
    const swapDetails = submarineState.swapDetails.data;
    const contracts = submarineState.contracts.ethereum;

    if (receiveCurrency.type === CurrencyTypes.Ether) {
      const etherSwap = new Contract(
        contracts.swapContracts.EtherSwap,
        ContractABIs.EtherSwap,
        signer
      );

      try {
        // TODO: work around metamask showing that you don't have enough ether (default is 20 seconds: https://github.com/MetaMask/eth-block-tracker/blob/master/src/polling.js#L14)
        const claimTransaction = await etherSwap.claim(
          getHexBuffer(swapInfo.preImage),
          formatTokenAmount(swapDetails.onchainAmount, 18),
          swapDetails.refundAddress,
          swapDetails.timeoutBlockHeight
        );

        // In Bitcoin the hash of the transaction data is not used when it comes to displaying data to the user
        // Instead the transaction id is the common standard (which is the reversed transaction hash)
        // On the Ethereum chain the hash itself is used
        dispatch(setClaimTransactionId(claimTransaction.hash));

        // TODO: fix this properly
        // Hack to work around Infura being slower than our node
      } catch (error) {
        await wait(1);
        await claimSwap(dispatch, nextStage, signer, swapInfo, swapResponse);
        return;
      }
    } else {
      const tokenContract = new Contract(
        contracts.tokens[receiveCurrency.symbol],
        ContractABIs.ERC20,
        signer
      );
      const erc20Swap = new Contract(
        contracts.swapContracts.ERC20Swap,
        ContractABIs.ERC20Swap,
        signer
      );

      try {
        const claimTransaction = await erc20Swap.claim(
          getHexBuffer(swapInfo.preImage),
          formatTokenAmount(
            swapDetails.onchainAmount,
            await tokenContract.decimals()
          ),
          tokenContract.address,
          swapDetails.refundAddress,
          swapDetails.timeoutBlockHeight
        );
        dispatch(setClaimTransactionId(claimTransaction.hash));

        // TODO: see line 131
      } catch (error) {
        await wait(1);
        await claimSwap(dispatch, nextStage, signer, swapInfo, swapResponse);
        return;
      }
    }
  } else {
    const feeEstimation = await getFeeEstimation();

    const claimTransaction = getClaimTransaction(
      receiveCurrency.symbol,
      swapInfo,
      swapResponse,
      feeEstimation
    );

    dispatch(setClaimTransactionId(claimTransaction.getId()));

    broadcastClaimTransaction(
      receiveCurrency.symbol,
      claimTransaction.toHex(),
      console.log,
      dispatch
    );
  }

  localStorage.removeItem(LocalStorageState.ActiveSwap);
  localStorage.removeItem(LocalStorageState.ExtraDetails);
  localStorage.removeItem(LocalStorageState.CurrentSubmarineState);
  localStorage.removeItem(LocalStorageState.CurrentReverseState);
  nextStage();
};

export const handleReverseSwapStatus =
  ({ instantSwap, privateKey, address, preImage }, signer) =>
  (data, source, dispatch, nextStage, swapInfo, response) => {
    const closeSource = () => {
      if (source) {
        source.close();
      }
    };

    const status = data.status;
    const swapDetails = { ...swapInfo, privateKey, address, preImage };

    // If this function is called with the data from the GET endpoint "/swapstatus"
    // it could be that the received status has already been handled
    if (status === latestSwapEvent) {
      return;
    } else {
      latestSwapEvent = status;
    }

    switch (status) {
      case SwapUpdateEvent.TransactionMempool:
        dispatch(
          reverseSwapResponse({
            transactionId: data.transaction.id,
            transactionHex: data.transaction.hex,
          })
        );

        if (instantSwap) {
          closeSource();
          claimSwap(dispatch, nextStage, signer, swapDetails, {
            ...response,
            transactionId: data.transaction.id,
            transactionHex: data.transaction.hex,
          });
        }

        break;

      case SwapUpdateEvent.TransactionConfirmed:
        closeSource();
        claimSwap(dispatch, nextStage, signer, swapDetails, {
          ...response,
          transactionId: data.transaction.id,
          transactionHex: data.transaction.hex,
        });
        break;

      case SwapUpdateEvent.MinerFeePaid:
        dispatch(setEthereumPrepayMinerFeePaid(true));
        break;

      case SwapUpdateEvent.SwapExpired:
      case SwapUpdateEvent.TransactionRefunded:
        closeSource();
        dispatch(setReverseSwapStatus('Timelock expired'));
        dispatch(reverseSwapResponse(false, {}));

        break;

      case SwapUpdateEvent.TransactionFailed:
        closeSource();
        dispatch(setReverseSwapStatus('Could not send onchain coins'));
        dispatch(reverseSwapResponse(false, {}));
        break;

      default:
        console.log(`Unknown swap status: ${JSON.stringify(data)}`);
        break;
    }
  };

export const createReverseSwap = (
  dispatch,
  payload,
  nextStep,
  extraDetails,
  signer
) => {
  createSwap(
    dispatch,
    payload,
    data => {
      dispatch(setSwapDetails(data));
      nextStep();
      localStorage.setItem(LocalStorageState.ActiveSwap, 'reverse');
    },
    nextStep,
    handleReverseSwapStatus(extraDetails, signer)
  );
};
