import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SwapStep } from '../constants/swap';
import Currency from '../constants/currency';
import { getSwapProvider } from '../utils/swapProvider';
import { RootState } from './index';

// Define a type for the slice state
interface SwapsState {
  sendAsset: Currency;
  receiveAsset: Currency;
  sendAmount: string;
  receiveAmount: string;
  swapStep: SwapStep;
  rates?: any;
}

// Define the initial state using that type
export const initialState: SwapsState = {
  swapStep: SwapStep.CHOOSE_PAIR,
  sendAsset: Currency.BTC,
  receiveAsset: Currency.LIGHTNING_BTC,
  sendAmount: '',
  receiveAmount: '',
};

export const swapsSlice = createSlice({
  name: 'swaps',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setSendAsset: (state, action: PayloadAction<Currency>) => {
      state.sendAsset = action.payload;
    },
    setReceiveAsset: (state, action: PayloadAction<Currency>) => {
      state.receiveAsset = action.payload;
    },
    setSendAmount: (state, action: PayloadAction<string>) => {
      state.sendAmount = action.payload;
    },
    setReceiveAmount: (state, action: PayloadAction<string>) => {
      state.receiveAmount = action.payload;
    },
    setRates: (state, action: PayloadAction<any>) => {
      state.rates = action.payload;
    },
    setSwapStep: (state, action: PayloadAction<SwapStep>) => {
      state.swapStep = action.payload;
    },
  },
});

export const {
  setSendAsset,
  setReceiveAsset,
  setSendAmount,
  setReceiveAmount,
  setRates,
  setSwapStep,
} = swapsSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectSwapStep = (state: RootState) => state.swaps.swapStep;
export const selectSendAsset = (state: RootState) => state.swaps.sendAsset;
export const selectReceiveAsset = (state: RootState) =>
  state.swaps.receiveAsset;
export const selectSendAmount = (state: RootState) => state.swaps.sendAmount;
export const selectReceiveAmount = (state: RootState) =>
  state.swaps.receiveAmount;
export const selectSwapProvider = (state: RootState) =>
  getSwapProvider(state.swaps.sendAsset, state.swaps.receiveAsset);
export const isRatesLoaded = (state: RootState) => !!state.swaps.rates;

export default swapsSlice.reducer;
