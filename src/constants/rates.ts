import BigNumber from 'bignumber.js';
import CurrencyID from './currency';

export enum AmountFeeType {
  Percentage = 'Percentage',
  Fixed = 'Fixed',
  // TODO add more types here for all providers
}

export type CurrencyPair = [CurrencyID, CurrencyID];

export interface CurrencyAmount {
  amount: BigNumber;
  currency: CurrencyID;
}

export interface AmountPreview {
  // This is comprehensive of swap provider fees
  amountWithFees: CurrencyAmount;
  // This is general purpose key value object that can be used to communicate
  // to end users the detail of amounts added into the amountWithFees
  feesDetail?: Record<AmountFeeType, number>;
}

export interface RatesFetcherOpts {}

export interface RatesFetcher {
  // PreviewGivenSend wants the sending amount and the currency entered by the user and will return the
  // amount to be received of the opposite currency in the pair, included of fees.
  previewGivenSend(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair
  ): Promise<AmountPreview>;

  // PreviewGivenReceive wants the receiving amount and the currency entered by the user and will return the
  // amount to be sent of the opposite currency in the pair, included of fees.
  previewGivenReceive(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair
  ): Promise<AmountPreview>;

  // define which trading pair is supported by the fetcher implementation
  isPairSupported(pair: CurrencyPair): boolean;
}
