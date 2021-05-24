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
};

export type StatusStep = {
  status: SwapUpdateEvent[];
  initialText?: string;
  textComplete: string;
};

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

export const swapError = (status: SwapUpdateEvent): string => {
  if (
    swapSteps
      .map(step => step.status)
      .concat([SwapUpdateEvent.InvoiceSet])
      .some(step => step.includes(status))
  ) {
    return '';
  }
  if (status === SwapUpdateEvent.InvoiceFailedToPay) {
    return 'Failed to pay the invoice. Please refund your coins.';
  }
  if (status === SwapUpdateEvent.TransactionLockupFailed) {
    return 'Deposited amount is insufficient. Please refund your coins.';
  }
  if (status === SwapUpdateEvent.SwapExpired) {
    return 'Swap expired. Please refund your coins if you transferred any to the provided address.';
  }
  return 'Error: Unknown status';
};
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

const getBoltzSwapsFromLocalStorage = (): RefundDetails[] => {
  return JSON.parse(localStorage.getItem('boltzSwaps') || '[]');
};

const setBoltzSwapsToLocalStorage = (swaps: RefundDetails[]): void => {
  localStorage.setItem('boltzSwaps', JSON.stringify(swaps));
};
