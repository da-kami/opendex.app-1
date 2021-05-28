import { createStyles, Grid, makeStyles } from '@material-ui/core';
import React, { ReactElement, useMemo, useState } from 'react';
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { BOLTZ_SWAP_STATUS_API_URL } from '../api/boltzApiUrls';
import BoltzChooseSwap from '../components/BoltzChooseSwap';
import BoltzRefundResult from '../components/BoltzRefundResult';
import BoltzRefundStatus from '../components/BoltzRefundStatus';
import BoltzSwapStep from '../components/BoltzSwapStep';
import CardComponent from '../components/Card';
import Title from '../components/Title';
import {
  RefundDetails,
  StatusResponse,
  SwapTransaction,
  SwapUpdateEvent,
} from '../constants/boltzSwap';
import { useBoltzConfiguration } from '../context/NetworkContext';
import Layout from '../layout/main';
import { timeDiffCalc } from '../services/refund/timestamp';
import {
  removeRefundDetailsFromLocalStorage,
  startRefund,
} from '../utils/boltzRefund';
import { startListening } from '../utils/boltzSwapStatus';
import { getErrorMessage } from '../utils/error';

type RefundStep = {
  content: ReactElement;
  buttonText: string;
  onButtonClick: () => void;
  buttonDisabled?: boolean;
};

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

const BoltzRefund = (): ReactElement => {
  const classes = useStyles();
  const boltzConfig = useBoltzConfiguration();
  const { apiEndpoint } = boltzConfig;
  const [errorMessage, setErrorMessage] = useState('');
  const [refundDetails, setRefundDetails] = useState<RefundDetails | undefined>(
    undefined
  );
  const [swapStatus, setSwapStatus] = useState<StatusResponse | undefined>(
    undefined
  );
  const [swapTransaction, setSwapTransaction] = useState<
    SwapTransaction | undefined
  >(undefined);
  const [activeStep, setActiveStep] = useState(0);
  const [address, setAddress] = useState('');

  const reset = () => {
    setActiveStep(0);
    setErrorMessage('');
    setRefundDetails(undefined);
    setSwapStatus(undefined);
    setSwapTransaction(undefined);
    setAddress('');
  };

  const getEta = () => {
    const d1 = new Date();
    const d2 = new Date(swapTransaction!.timeoutEta! * 1000);
    const { label, value } = timeDiffCalc(d2, d1);
    return {
      label,
      eta: value > 0 ? value : 0,
    };
  };

  const swapComplete =
    swapStatus?.status === SwapUpdateEvent.TransactionClaimed;

  const refundButtonText = () => {
    if (swapTransaction?.error) {
      return swapTransaction.error;
    }
    if (swapComplete) {
      return 'Ok';
    }
    if (swapTransaction?.timeoutEta) {
      const { label } = getEta();
      return `Refund possible in ~ ${label}`;
    }
    return 'Start Refund';
  };

  const steps: RefundStep[] = [
    {
      content: (
        <BoltzChooseSwap
          setErrorMessage={setErrorMessage}
          setRefundDetails={setRefundDetails}
        />
      ),
      buttonText: 'Check Status',
      onButtonClick: () => checkStatus(refundDetails!.swapId),
      buttonDisabled: !refundDetails,
    },
    {
      content: (
        <BoltzRefundStatus
          swapStatus={swapStatus!}
          refundDetails={refundDetails!}
          address={address}
          setAddress={setAddress}
          onSwapTransactionChange={setSwapTransaction}
        />
      ),
      buttonText: refundButtonText(),
      buttonDisabled:
        !swapComplete &&
        (!swapTransaction ||
          !!swapTransaction.error ||
          !!swapTransaction.timeoutEta ||
          !address),
      onButtonClick: () => {
        if (swapComplete) {
          reset();
          return;
        }
        startRefund(
          refundDetails!,
          address,
          swapTransaction!.transactionHex,
          boltzConfig
        ).subscribe({
          next: () => {},
          error: err => {
            setErrorMessage(getErrorMessage(err) || 'Refund failed');
            console.log('Refund failed:', err);
            setActiveStep(prev => prev + 1);
          },
          complete: () => {
            removeRefundDetailsFromLocalStorage(refundDetails!.swapId);
            setActiveStep(prev => prev + 1);
          },
        });
      },
    },
    {
      content: (
        <BoltzRefundResult
          swapId={refundDetails?.swapId}
          errorMessage={errorMessage}
        />
      ),
      buttonText: 'Refund Again',
      onButtonClick: reset,
    },
  ];

  const checkStatus = useMemo(
    () => (swapId: string): void => {
      from(
        fetch(BOLTZ_SWAP_STATUS_API_URL(apiEndpoint), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
          },
          body: JSON.stringify({ id: swapId }),
        })
      )
        .pipe(mergeMap(response => response.json()))
        .subscribe({
          next: status => {
            setSwapStatus(status);
            setActiveStep(prev => prev + 1);
            startListening(swapId, apiEndpoint, data => {
              setSwapStatus(data);
            });
          },
          error: err =>
            setErrorMessage(getErrorMessage(err) || 'Failed to get status'),
        });
    },
    [apiEndpoint]
  );

  return (
    <Layout>
      <Grid container direction="column" wrap="nowrap" alignItems="center">
        <Title>CROSS-CHAIN DEX AGGREGATOR</Title>
        <Grid item container direction="column" wrap="nowrap">
          <CardComponent>
            <div className={classes.root}>
              <BoltzSwapStep
                title="Check status or refund"
                content={steps[activeStep].content}
                mainButtonVisible
                mainButtonDisabled={steps[activeStep].buttonDisabled}
                mainButtonText={steps[activeStep].buttonText}
                errorMessage={errorMessage}
                onMainButtonClick={steps[activeStep].onButtonClick}
              />
            </div>
          </CardComponent>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default BoltzRefund;
