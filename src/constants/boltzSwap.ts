import { Transaction } from 'bitcoinjs-lib';
import CurrencyID from './currency';

export type BoltzSwapResponse = {
  id: string;
  timeoutBlockHeight: number;
  address: string;
  expectedAmount?: number;
  bip21?: string;
  redeemScript?: string;
  error?: string;
};

export type RefundDetails = {
  swapId: string;
  currency: CurrencyID;
  timeoutBlockHeight: number;
  redeemScript: string;
  privateKey: string;
  date: Date;
};

export type StatusResponse = {
  status: SwapUpdateEvent;
  failureReason: string;
};

export type StatusStep = {
  status: SwapUpdateEvent[];
  initialText?: string;
  textComplete: string;
};

export type SwapTransaction = {
  transactionHex: string;
  timeoutBlockHeight: number;
  timeoutEta?: number;
  error?: string;
};

export type RefundTransaction = {
  refundTransaction: Transaction;
  lockupTransactionId: string;
};

export type FeeResponse = { [key: string]: number };

export enum SwapUpdateEvent {
  InvoicePaid = 'invoice.paid',
  InvoiceSettled = 'invoice.settled',
  InvoiceSet = 'invoice.set',
  InvoiceFailedToPay = 'invoice.failedToPay',
  InvoicePending = 'invoice.pending',

  TransactionFailed = 'transaction.failed',
  TransactionLockupFailed = 'transaction.lockupFailed',
  TransactionMempool = 'transaction.mempool',
  TransactionClaimed = 'transaction.claimed',
  TransactionRefunded = 'transaction.refunded',
  TransactionConfirmed = 'transaction.confirmed',

  ChannelCreated = 'channel.created',

  MinerFeePaid = 'minerfee.paid',

  SwapExpired = 'swap.expired',
}

export const swapSteps: StatusStep[] = [
  {
    status: [SwapUpdateEvent.TransactionMempool],
    initialText: 'Waiting for transaction',
    textComplete: 'Transaction detected in mempool',
  },
  {
    status: [
      SwapUpdateEvent.TransactionConfirmed,
      SwapUpdateEvent.InvoicePending,
      SwapUpdateEvent.ChannelCreated,
    ],
    initialText: 'Waiting for one confirmation',
    textComplete: 'Transaction confirmed',
  },
  {
    status: [SwapUpdateEvent.InvoicePaid],
    initialText: 'Paying your invoice',
    textComplete: 'Invoice paid',
  },
  {
    status: [SwapUpdateEvent.TransactionClaimed],
    initialText: 'Transaction complete',
    textComplete: 'Transaction complete',
  },
];
