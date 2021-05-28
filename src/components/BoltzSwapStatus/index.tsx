import React, { ReactElement, useState } from 'react';
import { StatusResponse, swapSteps } from '../../constants/boltzSwap';
import { SwapStep } from '../../constants/swap';
import { useAppDispatch } from '../../store/hooks';
import { setSwapStep } from '../../store/swaps-slice';
import { swapError } from '../../utils/boltzSwapStatus';
import BoltzStatus from '../BoltzStatus';
import BoltzSwapStep from '../BoltzSwapStep';

type BoltzSwapStatusProps = {
  swapStatus: StatusResponse;
};

const BoltzSwapStatus = (props: BoltzSwapStatusProps): ReactElement => {
  const { swapStatus } = props;
  const [activeStep, setActiveStep] = useState<number | undefined>(undefined);
  const dispatch = useAppDispatch();

  const swapInProgress =
    !swapError(swapStatus) && !!activeStep && activeStep < swapSteps.length;

  return (
    <BoltzSwapStep
      title={!swapError(swapStatus) ? 'Swap status' : ''}
      content={
        <BoltzStatus
          swapStatus={swapStatus}
          showRefundButton
          onActiveStepChange={setActiveStep}
        />
      }
      mainButtonDisabled={swapInProgress}
      mainButtonText={swapInProgress ? 'Swap in progress' : 'Start a new swap'}
      onMainButtonClick={() => dispatch(setSwapStep(SwapStep.CHOOSE_PAIR))}
    />
  );
};

export default BoltzSwapStatus;
