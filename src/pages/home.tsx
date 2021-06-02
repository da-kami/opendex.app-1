import { Grid } from '@material-ui/core';
import { ReactElement } from 'react';
import ChooseTradingPair from '../components/ChooseTradingPair';
import SwapFlow from '../components/SwapFlow';
import SwapProvider from '../components/SwapProvider';
import Title from '../components/Title';
import { SwapStep } from '../constants/swap';
import Layout from '../layout/main';
import { useAppSelector } from '../store/hooks';
import {
  isRatesLoaded,
  selectSwapProvider,
  selectSwapStep,
} from '../store/swaps-slice';
import NetworkSelection from '../components/NetworkSelection';
import React from 'react';

export type HomePageProps = {};

const swapSteps = {
  [SwapStep.CHOOSE_PAIR]: <ChooseTradingPair />,
  [SwapStep.SWAP_FLOW]: <SwapFlow />,
};

const HomePage = (_props: HomePageProps): ReactElement => {
  const ratesLoaded = useAppSelector(isRatesLoaded);
  const swapProvider = useAppSelector(selectSwapProvider);
  const swapStep = useAppSelector(selectSwapStep);

  return (
    <Layout>
      <Grid container direction="column" wrap="nowrap" alignItems="center">
        <Title>CROSS-CHAIN DEX AGGREGATOR</Title>
        <NetworkSelection />

        <Grid item container direction="column" wrap="nowrap">
          {swapSteps[swapStep]}
          {ratesLoaded && !!swapProvider && (
            <SwapProvider provider={swapProvider} />
          )}
        </Grid>
      </Grid>
    </Layout>
  );
};

export default HomePage;
