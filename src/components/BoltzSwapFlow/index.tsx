import { createStyles, makeStyles } from '@material-ui/core';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { BOLTZ_STREAM_SWAP_STATUS_API_URL } from '../../api/boltzApiUrls';
import {
  BoltzSwapResponse,
  removeRefundDetailsFromLocalStorage,
  StatusResponse,
  SwapUpdateEvent,
} from '../../constants/boltzSwap';
import CurrencyID from '../../constants/currency';
import { useBoltzConfiguration } from '../../context/NetworkContext';
import { useAppSelector } from '../../store/hooks';
import { selectReceiveAsset, selectSendAsset } from '../../store/swaps-slice';
import BoltzDestination from '../BoltzDestination';
import BoltzSend from '../BoltzSend';
import BoltzStatus from '../BoltzStatus';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'space-between',
      flex: 1,
    },
  })
);

const startListening = (
  swapId: string,
  apiEndpoint: string,
  onMessage: (data: StatusResponse) => void
) => {
  const stream = new EventSource(
    `${BOLTZ_STREAM_SWAP_STATUS_API_URL(apiEndpoint)}?id=${swapId}`
  );
  stream.onmessage = function (event) {
    const data = JSON.parse(event.data);
    onMessage(data);
    if (
      [
        SwapUpdateEvent.TransactionClaimed,
        SwapUpdateEvent.InvoiceFailedToPay,
        SwapUpdateEvent.TransactionLockupFailed,
        SwapUpdateEvent.SwapExpired,
      ].includes(data.status)
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

const BoltzSwapFlow = (): ReactElement => {
  const classes = useStyles();
  const receiveCurrency = useAppSelector(selectReceiveAsset);
  const sendCurrency = useAppSelector(selectSendAsset);
  const [activeStep, setActiveStep] = useState(0);
  const [swapDetails, setSwapDetails] = useState<BoltzSwapResponse | undefined>(
    undefined
  );
  const [swapStatus, setSwapStatus] = useState<SwapUpdateEvent | undefined>(
    undefined
  );
  const { apiEndpoint } = useBoltzConfiguration();

  const proceedToNext = useCallback(
    () => setActiveStep(oldValue => oldValue + 1),
    [setActiveStep]
  );

  const destinationComplete = useMemo(
    () => (swapDetails: BoltzSwapResponse) => {
      setSwapDetails(swapDetails);
      proceedToNext();
      startListening(swapDetails.id, apiEndpoint, data => {
        setSwapStatus(data.status);
      });
    },
    [proceedToNext, apiEndpoint]
  );

  const isPairImplemented = () => {
    return (
      sendCurrency === CurrencyID.BTC &&
      receiveCurrency === CurrencyID.LIGHTNING_BTC
    );
  };

  const steps = [
    <BoltzDestination proceedToNext={destinationComplete} />,
    <BoltzSend
      swapDetails={swapDetails!}
      swapStatus={swapStatus}
      proceedToNext={proceedToNext}
    />,
    <BoltzStatus swapDetails={swapDetails!} swapStatus={swapStatus!} />,
  ];

  return (
    <div className={classes.root}>
      {isPairImplemented() ? steps[activeStep] : <div>Not implemented</div>}
    </div>
  );
};

export default BoltzSwapFlow;
