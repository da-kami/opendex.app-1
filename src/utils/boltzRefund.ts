import { address, ECPair, Network, Transaction } from 'bitcoinjs-lib';
import { constructRefundTransaction, detectSwap } from 'boltz-core';
import qrcodeParser from 'qrcode-parser';
import { from, Observable, of, throwError } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import {
  BOLTZ_BROADCAST_TRANSACTION_API_URL,
  BOLTZ_GET_FEE_ESTIMATION_API_URL,
} from '../api/boltzApiUrls';
import {
  FeeResponse,
  RefundDetails,
  RefundTransaction,
} from '../constants/boltzSwap';
import CurrencyID from '../constants/currency';
import { BoltzConfiguration } from '../context/NetworkContext';

export const addRefundDetailsToLocalStorage = (
  details: RefundDetails
): void => {
  const boltzSwaps = getBoltzSwapsFromLocalStorage();
  boltzSwaps.push(details);
  setBoltzSwapsToLocalStorage(boltzSwaps);
};

export const removeRefundDetailsFromLocalStorage = (swapId: string): void => {
  const boltzSwaps = getBoltzSwapsFromLocalStorage();
  const swapIndex = boltzSwaps.findIndex(swap => swap.swapId === swapId);
  if (swapIndex !== -1) {
    boltzSwaps.splice(swapIndex, 1);
    setBoltzSwapsToLocalStorage(boltzSwaps);
  }
};

export const getBoltzSwapsFromLocalStorage = (): RefundDetails[] => {
  return JSON.parse(localStorage.getItem('boltzSwaps') || '[]');
};

const setBoltzSwapsToLocalStorage = (swaps: RefundDetails[]): void => {
  localStorage.setItem('boltzSwaps', JSON.stringify(swaps));
};

const verifyRefundFile = (fileJSON: Object, keys: string[]) => {
  return keys.every(key => Object.prototype.hasOwnProperty.call(fileJSON, key));
};

export const convertRefundFile = async (
  file: File
): Promise<RefundDetails | undefined> => {
  let fileJson;

  switch (file.type) {
    case 'application/json':
      const reader = new window.FileReader();
      reader.readAsText(file);

      await new Promise<void>(resolve => {
        reader.onload = () => {
          fileJson = JSON.parse(reader.result as string);
          resolve();
        };
      });
      break;

    case 'image/png':
      qrcodeParser(file)
        .then(parsedQr => {
          fileJson = JSON.parse(parsedQr.data);
        })
        .catch(() => (fileJson = {}));
      try {
        const parsedQr = await qrcodeParser(file);
        fileJson = JSON.parse(parsedQr.data);
      } catch {
        fileJson = {};
      } finally {
        break;
      }

    default:
      window.alert(`Unknown refund file format: ${file.type}`);
      return;
  }

  const verifyFile = verifyRefundFile(fileJson, [
    'swapId',
    'currency',
    'redeemScript',
    'privateKey',
    'timeoutBlockHeight',
  ]);

  return verifyFile ? fileJson : undefined;
};

export const startRefund = (
  refundFile: RefundDetails,
  destinationAddress: string,
  transactionHash: string,
  boltzConfig: BoltzConfiguration
): Observable<void> => {
  const currency = refundFile.currency;
  return getFeeEstimation(boltzConfig.apiEndpoint).pipe(
    mergeMap(fees =>
      createRefundTransaction(
        refundFile,
        transactionHash,
        destinationAddress,
        currency,
        fees,
        boltzConfig
      )
    ),
    mergeMap((tx: RefundTransaction) =>
      broadcastRefund(
        currency,
        tx.refundTransaction.toHex(),
        boltzConfig.apiEndpoint
      )
    )
  );
};

const getFeeEstimation = (apiEndpoint: string): Observable<FeeResponse> => {
  return from(fetch(BOLTZ_GET_FEE_ESTIMATION_API_URL(apiEndpoint))).pipe(
    mergeMap((resp: Response) =>
      from(resp.json()).pipe(
        mergeMap(body => (resp.ok ? of(body) : throwError(body)))
      )
    )
  );
};

const getHexBuffer = (input: string): Buffer => {
  return Buffer.from(input, 'hex');
};

const getNetwork = (
  currency: CurrencyID,
  boltzConfig: BoltzConfiguration
): Network => {
  return currency === CurrencyID.BTC
    ? boltzConfig.bitcoinConstants
    : boltzConfig.litecoinConstants;
};

const createRefundTransaction = (
  refundFile: RefundDetails,
  transactionHash: string,
  destinationAddress: string,
  currency: CurrencyID,
  feeEstimation: FeeResponse,
  boltzConfig: BoltzConfiguration
): Observable<RefundTransaction> => {
  const redeemScript = getHexBuffer(refundFile.redeemScript);
  const lockupTransaction = Transaction.fromHex(transactionHash);

  return of({
    refundTransaction: constructRefundTransaction(
      [
        {
          redeemScript,
          txHash: lockupTransaction.getHash(),
          keys: ECPair.fromPrivateKey(getHexBuffer(refundFile.privateKey)),
          ...detectSwap(redeemScript, lockupTransaction)!,
        },
      ],
      address.toOutputScript(
        destinationAddress,
        getNetwork(currency, boltzConfig)
      ),
      refundFile.timeoutBlockHeight,
      feeEstimation[currency]
    ),
    lockupTransactionId: lockupTransaction.getId(),
  });
};

const broadcastRefund = (
  currency: CurrencyID,
  transactionHex: string,
  apiEndpoint: string
): Observable<void> => {
  return from(
    fetch(BOLTZ_BROADCAST_TRANSACTION_API_URL(apiEndpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({
        currency,
        transactionHex,
      }),
    })
  ).pipe(
    mergeMap(resp => resp.json()),
    filter(data => !!data.error),
    mergeMap(data => {
      throw new Error(`Failed to broadcast transaction: ${data.error}`);
    })
  );
};
