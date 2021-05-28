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
import { StatusResponse, swapSteps } from '../../constants/boltzSwap';
import { swapError } from '../../utils/boltzSwapStatus';
import svgIcons from '../../utils/svgIcons';
import { Path } from '../App/path';
import Button from '../Button';

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
  const history = useHistory();

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
      {swapError(swapStatus) ? (
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
          {showRefundButton && (
            <Button
              variant="outlined"
              size="large"
              color="primary"
              onClick={() => history.push(Path.BOLTZ_REFUND)}
              className={classes.refundButton}
            >
              Refund
            </Button>
          )}
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
      )}
    </>
  );
};

export default BoltzStatus;
