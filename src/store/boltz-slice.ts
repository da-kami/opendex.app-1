import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FundTransferType, fundTransferTypes } from '../constants/currency';
import { RootState } from './index';

interface BoltzState {
  unit: SelectedFundTransferType;
}

type SelectedFundTransferType = {
  [key: string]: FundTransferType;
};

const defaultUnitValues = Object.fromEntries(
  Object.entries(fundTransferTypes).map(([key, val]) => [
    key,
    val.find(val => val.value === '2'),
  ])
);

export const initialState: BoltzState = {
  unit: {
    ...defaultUnitValues,
    ...JSON.parse(localStorage.getItem('boltzUnits') || '{}'),
  },
};

export const swapsSlice = createSlice({
  name: 'boltz',
  initialState,
  reducers: {
    setUnit: (state, action: PayloadAction<SelectedFundTransferType>) => {
      state.unit = { ...state.unit, ...action.payload };
      localStorage.setItem('boltzUnits', JSON.stringify(state.unit));
    },
  },
});

export const { setUnit } = swapsSlice.actions;

export const selectUnit = (state: RootState) => state.boltz.unit;

export default swapsSlice.reducer;
