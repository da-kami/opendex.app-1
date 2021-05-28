import { createStyles, makeStyles, TextField } from '@material-ui/core';
import React, { ReactElement, useEffect, useState } from 'react';
import { from, timer } from 'rxjs';
import { mergeMap, retry } from 'rxjs/operators';
import { BOLTZ_GET_SWAP_TRANSACTION_API_URL } from '../../api/boltzApiUrls';
import {
  RefundDetails,
  StatusResponse,
  swapSteps,
  SwapTransaction,
  SwapUpdateEvent,
} from '../../constants/boltzSwap';
import { useBoltzConfiguration } from '../../context/NetworkContext';
import BoltzStatus from '../BoltzStatus';

type BoltzRefundStatusProps = {
  refundDetails: RefundDetails;
  swapStatus: StatusResponse;
  address: string;
  setAddress: (value: string) => void;
  onSwapTransactionChange: (transaction: SwapTransaction) => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    addressField: {
      marginTop: '1rem',
    },
  })
);

const BoltzRefundStatus = (props: BoltzRefundStatusProps): ReactElement => {
  const classes = useStyles();
  const {
    refundDetails,
    swapStatus,
    address,
    setAddress,
    onSwapTransactionChange,
  } = props;
  const { apiEndpoint } = useBoltzConfiguration();
  const [swapTransaction, setSwapTransaction] = useState<
    SwapTransaction | undefined
  >(undefined);
  const [queryTransaction, setQueryTransaction] = useState(true);

  const addressFieldText = `Insert your ${refundDetails.currency} address for refund`;

  useEffect(() => {
    if (!queryTransaction) {
      return;
    }
    const sub = timer(0, 60000)
      .pipe(
        mergeMap(() =>
          from(
            fetch(BOLTZ_GET_SWAP_TRANSACTION_API_URL(apiEndpoint), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json;charset=utf-8',
              },
              body: JSON.stringify({ id: refundDetails.swapId }),
            })
          )
        ),
        mergeMap(response => response.json()),
        retry(10)
      )
      .subscribe({
        next: transaction => {
          setSwapTransaction(transaction);
          onSwapTransactionChange(transaction);
          if (
            !transaction.timeoutEta &&
            swapStatus.status !== SwapUpdateEvent.InvoiceSet
          ) {
            setQueryTransaction(false);
          }
        },
        error: err => console.log('Failed to get swap transaction data:', err),
      });
    return () => sub.unsubscribe();
  }, [
    queryTransaction,
    apiEndpoint,
    refundDetails,
    swapStatus.status,
    onSwapTransactionChange,
  ]);

  return (
    <>
      <BoltzStatus swapStatus={swapStatus!} />
      {!!swapTransaction?.transactionHex &&
        !swapSteps.some(step => step.status.includes(swapStatus.status)) && (
          <TextField
            className={classes.addressField}
            multiline
            fullWidth
            variant="outlined"
            aria-label={addressFieldText}
            rows={3}
            disabled={!!swapTransaction?.timeoutEta}
            placeholder={addressFieldText}
            value={address}
            onChange={e => {
              setAddress(e.target.value);
            }}
          />
        )}
    </>
  );
};

export default BoltzRefundStatus;
