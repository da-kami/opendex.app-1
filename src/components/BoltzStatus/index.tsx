import {
  createStyles,
  LinearProgress,
  makeStyles,
  Step,
  StepContent,
  StepLabel,
  Stepper,
} from '@material-ui/core';
import React, { ReactElement, useEffect, useState } from 'react';
import {
  StatusResponse,
  swapSteps,
  SwapUpdateEvent,
} from '../../constants/boltzSwap';
import { swapError } from '../../utils/boltzSwapStatus';
import BoltzSwapResult from '../BoltzSwapResult';

type BoltzStatusProps = {
  swapStatus: StatusResponse;
  showRefundButton?: boolean;
  onActiveStepChange?: (step: number) => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    progressBar: {
      height: '2px',
    },
    imageContainer: {
      padding: '2rem',
    },
    refundButton: {
      margin: '2rem 0',
    },
  })
);

const BoltzStatus = (props: BoltzStatusProps): ReactElement => {
  const classes = useStyles();
  const { swapStatus, showRefundButton, onActiveStepChange } = props;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const statuses = swapSteps.map(step => step.status);
    const statusIndex = statuses.findIndex(status =>
      status.includes(swapStatus.status)
    );
    if (statusIndex !== -1) {
      const newActiveStep = statusIndex + 1;
      setActiveStep(newActiveStep);
      !!onActiveStepChange && onActiveStepChange(newActiveStep);
    }
  }, [swapStatus, setActiveStep, onActiveStepChange]);

  return (
    <>
      {swapError(swapStatus) ||
      swapStatus.status === SwapUpdateEvent.TransactionClaimed ? (
        <BoltzSwapResult
          swapStatus={swapStatus}
          showRefundButton={showRefundButton}
        />
      ) : (
        <>
          <Stepper activeStep={activeStep} orientation="vertical">
            {swapSteps.map((step, index) => (
              <Step key={step.status[0]}>
                <StepLabel>
                  {activeStep > index ? step.textComplete : step.initialText}
                </StepLabel>
                <StepContent>
                  <LinearProgress className={classes.progressBar} />
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </>
      )}
    </>
  );
};

export default BoltzStatus;
