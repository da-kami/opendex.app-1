import { Grid, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import AssetSelector from '../AssetSelector';
import Button from '../Button';
import CardComponent from '../Card';
import ErrorMessage from '../ErrorMessage';
import SwapButton from '../SwapButton';
import { SwapStep, SwapProvider } from '../../constants/swap';
import { CurrencyOptions, CurrencyOption } from '../../constants/currency';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  isRatesLoaded,
  selectSendAmount,
  selectSendAsset,
  selectReceiveAmount,
  selectReceiveAsset,
  selectSwapProvider,
  setSendAmount,
  setSendAsset,
  setReceiveAmount,
  setReceiveAsset,
  setRates,
  setSwapStep,
} from '../../store/swaps-slice';
import { timer } from 'rxjs';
import { AmountPreview, RatesFetcher } from '../../constants/rates';
import useExampleHook from '../../constants/ratesExampleHook';
import BigNumber from 'bignumber.js';
import useComitFetcher from '../ComitSwapFlow/useComitFetcher';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'space-between',
      flex: 1,
    },
    content: {
      padding: '2rem',
    },
    text: {
      marginBottom: '1rem',
      fontSize: '1.5rem',
      lineHeight: 'normal',
      letterSpacing: '1px',
    },
    amount: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '1rem',
    },
    right: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    amountscontainer: {
      marginTop: '1rem',
    },
    errorMessageContainer: {
      minHeight: '1.5rem',
      marginTop: '1rem',
    },
  })
);

export type ChooseTradingPairProps = {};

const ChooseTradingPair = (_props: ChooseTradingPairProps) => {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const sendAsset = useAppSelector(selectSendAsset);
  const receiveAsset = useAppSelector(selectReceiveAsset);
  const sendAmount = useAppSelector(selectSendAmount);
  const receiveAmount = useAppSelector(selectReceiveAmount);
  const swapProvider = useAppSelector(selectSwapProvider);
  const ratesLoaded = useAppSelector(isRatesLoaded);

  const [isPreviewing, setIsPreviewing] = useState(false);

  // TODO: Should be handled in a reducer
  const [previewValueError, setPreviewValueError] =
    useState<Error | null>(null);

  const sendCurrency = CurrencyOptions.find(
    currency => currency.id === sendAsset
  )!;
  const receiveCurrency = CurrencyOptions.find(
    currency => currency.id === receiveAsset
  )!;

  timer(1000).subscribe(() => dispatch(setRates({})));
  const nextDisabled =
    !ratesLoaded ||
    Number(sendAmount) === 0 ||
    Number(receiveAmount) === 0 ||
    !swapProvider;

  const tdexFetcher = useExampleHook();
  const comitFetcher = useComitFetcher();

  let ratesFetcher: RatesFetcher | null;
  switch (swapProvider) {
    case SwapProvider.TDEX:
      ratesFetcher = tdexFetcher;
      break;
    case SwapProvider.COMIT:
      ratesFetcher = comitFetcher;
      break;
    case SwapProvider.BOLTZ:
    default:
      break;
  }

  const amountIsPositive = (x: any): boolean => {
    if (!Number.isNaN(x) && Number(x) > 0) {
      return true;
    }

    return false;
  };

  const onSendAmountChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (isPreviewing) return;

    const value = e.target.value;
    dispatch(setSendAmount(value));

    // preview other amount
    if (ratesFetcher && amountIsPositive(value)) {
      setIsPreviewing(true);

      const amount = new BigNumber(value);

      try {
        setPreviewValueError(null);
        const receiveValue: AmountPreview = await ratesFetcher.previewGivenSend(
          {
            amount,
            currency: sendCurrency.id,
          },
          [sendCurrency.id, receiveCurrency.id]
        );

        dispatch(
          setReceiveAmount(
            receiveValue.amountWithFees.amount
              .toNumber()
              .toLocaleString(undefined, {
                maximumFractionDigits: 8,
              })
          )
        );
        setIsPreviewing(false);
      } catch (e) {
        if (!previewValueError) {
          setPreviewValueError(e);
        }
      }
    }
  };

  const onReceiveAmountChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (isPreviewing) return;

    const value = e.target.value;
    dispatch(setReceiveAmount(value));

    // preview other amount
    if (ratesFetcher && amountIsPositive(value)) {
      setIsPreviewing(true);

      const amount = new BigNumber(value);

      try {
        setPreviewValueError(null);
        const sendValue: AmountPreview = await ratesFetcher.previewGivenReceive(
          {
            amount,
            currency: receiveCurrency.id,
          },
          [sendCurrency.id, receiveCurrency.id]
        );

        dispatch(
          setSendAmount(
            sendValue.amountWithFees.amount
              .toNumber()
              .toLocaleString(undefined, {
                maximumFractionDigits: 8,
              })
          )
        );
        setIsPreviewing(false);
      } catch (e) {
        if (!previewValueError) {
          setPreviewValueError(e);
        }
      }
    }
  };

  const renderCryptoOptions = () => {
    return (
      <Grid container justify="center" direction="row" alignItems="center">
        <Grid item xs={12}>
          <AssetSelector
            label={'You send'}
            value={sendAmount}
            placeholder={'0.00'}
            onAmountChange={onSendAmountChange}
            onAssetChange={(currency: CurrencyOption) =>
              dispatch(setSendAsset(currency.id))
            }
            selectedAsset={sendCurrency}
            loading={!ratesLoaded}
          />
        </Grid>
        <Grid item xs={12}>
          <SwapButton
            onClick={() => {
              dispatch(setSendAsset(receiveCurrency.id));
              dispatch(setReceiveAsset(sendCurrency.id));
            }}
            disabled={!ratesLoaded}
          />
        </Grid>
        <Grid item xs={12}>
          <AssetSelector
            label={'You receive'}
            value={receiveAmount}
            placeholder={'0.00'}
            onAmountChange={onReceiveAmountChange}
            onAssetChange={(currency: CurrencyOption) =>
              dispatch(setReceiveAsset(currency.id))
            }
            selectedAsset={receiveCurrency}
            loading={!ratesLoaded}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <CardComponent>
      <div className={classes.root}>
        <Grid container justify="flex-start" className={classes.content}>
          <Typography className={classes.text} component="h2" align="left">
            Swap
          </Typography>
          {renderCryptoOptions()}
          <Grid
            item
            container
            justify="center"
            className={classes.errorMessageContainer}
          >
            {!swapProvider && ratesLoaded && (
              <ErrorMessage message="Trading pair not supported" />
            )}
            {previewValueError ? (
              <ErrorMessage message={previewValueError.message} />
            ) : (
              <></>
            )}
          </Grid>
        </Grid>
        <Button
          variant="contained"
          color="primary"
          disabled={nextDisabled}
          onClick={() => dispatch(setSwapStep(SwapStep.SWAP_FLOW))}
        >
          Next
        </Button>
      </div>
    </CardComponent>
  );
};

export default ChooseTradingPair;
