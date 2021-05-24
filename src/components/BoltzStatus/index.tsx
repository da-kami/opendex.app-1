import {
  createStyles,
  Grid,
  LinearProgress,
  makeStyles,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@material-ui/core';
import React, { ReactElement, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import {
  BoltzSwapResponse,
  swapError,
  swapSteps,
  SwapUpdateEvent,
} from '../../constants/boltzSwap';
import { SwapStep } from '../../constants/swap';
import { useAppDispatch } from '../../store/hooks';
import { setSwapStep } from '../../store/swaps-slice';
import svgIcons from '../../utils/svgIcons';
import { Path } from '../App/path';
import BoltzSwapStep from '../BoltzSwapStep';
import Button from '../Button';

type BoltzStatusProps = {
  swapDetails: BoltzSwapResponse;
  swapStatus: SwapUpdateEvent;
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
  const { swapStatus } = props;
  const [activeStep, setActiveStep] = useState(0);
  const dispatch = useAppDispatch();
  const history = useHistory();

  const swapInProgress =
    !swapError(swapStatus) && activeStep < swapSteps.length;

  useEffect(() => {
    const statuses = swapSteps.map(step => step.status);
    const statusIndex = statuses.findIndex(status =>
      status.includes(swapStatus)
    );
    if (statusIndex !== -1) {
      setActiveStep(statusIndex + 1);
    }
  }, [swapStatus, setActiveStep]);

  return (
    <BoltzSwapStep
      title={!swapError(swapStatus) ? 'Swap status' : ''}
      content={
        swapError(swapStatus) ? (
          <Grid
            item
            container
            justify="center"
            alignItems="center"
            direction="column"
          >
            <Grid item className={classes.imageContainer}>
              <img src={svgIcons.snap} alt="aw, snap!" />
            </Grid>
            <Typography align="center">{swapError(swapStatus)}</Typography>
            <Button
              variant="outlined"
              size="large"
              color="primary"
              onClick={() => history.push(Path.BOLTZ_REFUND)}
              className={classes.refundButton}
            >
              Refund
            </Button>
          </Grid>
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
        )
      }
      mainButtonVisible
      mainButtonDisabled={swapInProgress}
      mainButtonText={swapInProgress ? 'Swap in progress' : 'Start a new swap'}
      onMainButtonClick={() => dispatch(setSwapStep(SwapStep.CHOOSE_PAIR))}
    />
  );
};

export default BoltzStatus;
