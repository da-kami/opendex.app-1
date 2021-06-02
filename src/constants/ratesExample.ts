import BigNumber from 'bignumber.js';
import CurrencyID from './currency';
import {
  RatesFetcher,
  AmountPreview,
  CurrencyAmount,
  RatesFetcherOpts,
  CurrencyPair,
} from './rates';

interface ExampleOptions extends RatesFetcherOpts {
  url: string;
  useInterval: boolean;
}

export default class ExampleFetcherWithInitalizer implements RatesFetcher {
  private url: string;
  private useInterval: boolean;
  private interval: any;
  private usdPerBtc: BigNumber = new BigNumber(0);
  private isFetching: boolean = false;

  constructor(options: ExampleOptions) {
    this.url = options.url;
    this.useInterval = options.useInterval;

    if (options.useInterval) {
      this.interval = setInterval(async () => {
        if (this.isFetching) return;

        this.isFetching = true;

        this.usdPerBtc = await this._fetchPriceBTC();

        this.isFetching = false;
      }, 1000);
    }
  }

  clean(): void {
    if (this.useInterval && this.interval) {
      clearInterval(this.interval);
    }
  }

  isPairSupported(pair: CurrencyPair): boolean {
    return (
      pair.includes(CurrencyID.LIQUID_BTC) &&
      pair.includes(CurrencyID.LIQUID_USDT)
    );
  }

  preview(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair,
    isSend: boolean = true
  ): Promise<AmountPreview> {
    if (!this.isPairSupported(pair)) throw new Error('pair is not support');

    return this.previewBTCUSDT(amountWithCurrency, isSend);
  }

  // PreviewGivenSend does the same thing as Preview with isSend = true
  previewGivenSend(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair
  ): Promise<AmountPreview> {
    if (!this.isPairSupported(pair)) throw new Error('pair is not support');

    return this.previewBTCUSDT(amountWithCurrency, true);
  }

  // PreviewGivenReceive does the same thing as Preview with isSend = false
  previewGivenReceive(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair
  ): Promise<AmountPreview> {
    if (!this.isPairSupported(pair)) throw new Error('pair is not support');

    return this.previewBTCUSDT(amountWithCurrency, false);
  }

  private async _fetchPriceBTC(): Promise<BigNumber> {
    const res = await fetch(this.url);
    const json = await res.json();

    return new BigNumber(json.bitcoin.usd as number);
  }

  private async previewBTCUSDT(
    amountWithCurrency: CurrencyAmount,
    isSend: boolean = true
  ): Promise<AmountPreview> {
    const usdPerBtc = this.useInterval
      ? this.usdPerBtc
      : await this._fetchPriceBTC();

    const isBTCcomingIn =
      (isSend && amountWithCurrency.currency === CurrencyID.LIQUID_BTC) ||
      (!isSend && amountWithCurrency.currency !== CurrencyID.LIQUID_USDT);

    const amount = isBTCcomingIn
      ? usdPerBtc.multipliedBy(amountWithCurrency.amount)
      : amountWithCurrency.amount.dividedBy(usdPerBtc);
    const currency = isBTCcomingIn
      ? CurrencyID.LIQUID_USDT
      : CurrencyID.LIQUID_BTC;
    return {
      amountWithFees: {
        amount: amount,
        currency: currency,
      },
    };
  }

  public static async WithoutInterval(): Promise<ExampleOptions> {
    // here I can do all my async initiazization and instantiate my class as I wish
    return {
      useInterval: false,
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    };
  }

  public static async WithInterval(): Promise<ExampleOptions> {
    // here I can do all my async initiazization and instantiate my class as I wish
    return {
      useInterval: true,
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    };
  }
}
