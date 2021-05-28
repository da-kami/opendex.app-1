import { BOLTZ_STREAM_SWAP_STATUS_API_URL } from '../api/boltzApiUrls';
import {
  StatusResponse,
  swapSteps,
  SwapUpdateEvent,
} from '../constants/boltzSwap';
import { removeRefundDetailsFromLocalStorage } from './boltzRefund';

export const startListening = (
  swapId: string,
  apiEndpoint: string,
  onMessage: (data: StatusResponse) => void
) => {
  const stream = new EventSource(
    `${BOLTZ_STREAM_SWAP_STATUS_API_URL(apiEndpoint)}?id=${swapId}`
  );
  stream.onmessage = function (event) {
    const data: StatusResponse = JSON.parse(event.data);
    onMessage(data);
    if (
      SwapUpdateEvent.TransactionClaimed === data.status ||
      data.failureReason
    ) {
      stream.close();
      if (SwapUpdateEvent.TransactionClaimed === data.status) {
        removeRefundDetailsFromLocalStorage(swapId);
      }
    }
  };
  stream.onerror = event => {
    console.log('error:', event);
    stream?.close();
    setTimeout(() => startListening(swapId, apiEndpoint, onMessage), 2000);
  };
};

export const swapError = (status: StatusResponse): string => {
  if (
    swapSteps
      .map(step => step.status)
      .concat([SwapUpdateEvent.InvoiceSet])
      .some(step => step.includes(status.status))
  ) {
    return '';
  }
  if (status.status === SwapUpdateEvent.InvoiceFailedToPay) {
    return 'Failed to pay the invoice. Please refund your coins.';
  }
  if (status.status === SwapUpdateEvent.TransactionLockupFailed) {
    return 'Deposited amount is insufficient. Please refund your coins.';
  }
  if (status.status === SwapUpdateEvent.SwapExpired) {
    return 'Swap expired. Please refund your coins if you transferred any to the provided address.';
  }
  return status.failureReason || 'Error: Unknown status';
};
