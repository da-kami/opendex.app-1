import { createStyles, makeStyles } from '@material-ui/core';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { BoltzSwapResponse, StatusResponse } from '../../constants/boltzSwap';
import CurrencyID from '../../constants/currency';
import { useBoltzConfiguration } from '../../context/NetworkContext';
import { useAppSelector } from '../../store/hooks';
import { selectReceiveAsset, selectSendAsset } from '../../store/swaps-slice';
import { startListening } from '../../utils/boltzSwapStatus';
import BoltzDestination from '../BoltzDestination';
import BoltzSend from '../BoltzSend';
import BoltzSwapStatus from '../BoltzSwapStatus';

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

const BoltzSwapFlow = (): ReactElement => {
  const classes = useStyles();
  const receiveCurrency = useAppSelector(selectReceiveAsset);
  const sendCurrency = useAppSelector(selectSendAsset);
  const [activeStep, setActiveStep] = useState(0);
  const [swapDetails, setSwapDetails] = useState<BoltzSwapResponse | undefined>(
    undefined
  );
  const [swapStatus, setSwapStatus] = useState<StatusResponse | undefined>(
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
        setSwapStatus(data);
      });
    },
    [proceedToNext, apiEndpoint]
  );

  const isPairImplemented = () => {
    return (
      (sendCurrency === CurrencyID.BTC &&
        receiveCurrency === CurrencyID.LIGHTNING_BTC) ||
      (sendCurrency === CurrencyID.LTC &&
        receiveCurrency === CurrencyID.LIGHTNING_LTC)
    );
  };

  const steps = [
    <BoltzDestination proceedToNext={destinationComplete} />,
    <BoltzSend
      swapDetails={swapDetails!}
      swapStatus={swapStatus}
      proceedToNext={proceedToNext}
    />,
    <BoltzSwapStatus swapStatus={swapStatus!} />,
  ];

  return (
    <div className={classes.root}>
      {isPairImplemented() ? steps[activeStep] : <div>Not implemented</div>}
    </div>
  );
};

export default BoltzSwapFlow;
