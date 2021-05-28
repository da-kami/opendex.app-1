import {
  createStyles,
  Grid,
  InputAdornment,
  makeStyles,
  TextField,
} from '@material-ui/core';
import BigNumber from 'bignumber.js';
import React, { ReactElement, useEffect } from 'react';
import {
  BoltzSwapResponse,
  StatusResponse,
  SwapUpdateEvent,
} from '../../constants/boltzSwap';
import { useAppSelector } from '../../store/hooks';
import { selectSendAsset } from '../../store/swaps-slice';
import { swapError } from '../../utils/boltzSwapStatus';
import BoltzAmount from '../BoltzAmount';
import BoltzSwapStep from '../BoltzSwapStep';
import Button from '../Button';
import DrawQrCode from '../DrawQrCode';

type BoltzSendProps = {
  swapDetails: BoltzSwapResponse;
  swapStatus?: StatusResponse;
  proceedToNext: () => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    qrCodeContainer: {
      marginTop: '1rem',
    },
    input: {
      borderRadius: 0,
    },
  })
);

const BoltzSend = (props: BoltzSendProps): ReactElement => {
  const classes = useStyles();
  const { swapDetails, swapStatus, proceedToNext } = props;
  const sendCurrency = useAppSelector(selectSendAsset);

  const isWaitingForTransaction =
    !swapStatus || swapStatus.status === SwapUpdateEvent.InvoiceSet;

  useEffect(() => {
    if (swapStatus && swapError(swapStatus)) {
      proceedToNext();
    }
  }, [swapStatus, proceedToNext]);

  return (
    <BoltzSwapStep
      title={
        <>
          Send
          <br />
          <BoltzAmount
            amountInMainUnit={new BigNumber(swapDetails.expectedAmount!)
              .dividedBy(10 ** 8)
              .toString()}
            currency={sendCurrency}
          />
        </>
      }
      content={
        <>
          <TextField
            fullWidth
            variant="outlined"
            multiline
            disabled
            value={swapDetails.address}
            InputProps={{
              className: classes.input,
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={() =>
                      navigator.clipboard?.writeText(swapDetails.address)
                    }
                  >
                    Copy
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          <Grid
            item
            container
            justify="center"
            className={classes.qrCodeContainer}
          >
            <DrawQrCode size={200} link={swapDetails.bip21!} />
          </Grid>
        </>
      }
      mainButtonVisible
      mainButtonText={
        isWaitingForTransaction ? 'Waiting for transaction' : 'Next'
      }
      mainButtonDisabled={isWaitingForTransaction}
      onMainButtonClick={proceedToNext}
    />
  );
};

export default BoltzSend;
