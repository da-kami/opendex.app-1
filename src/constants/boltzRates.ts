import BigNumber from 'bignumber.js';
import { from, interval, Observable, of, Subscription } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
  catchError,
  map,
  mergeMap,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';
// import { GET_PAIRS } from '../api/apiUrls';
import CurrencyID from './currency';
import {
  AmountPreview,
  CurrencyAmount,
  CurrencyPair,
  Limits,
  RatesFetcher,
  RatesFetcherOpts,
} from './rates';

interface BoltzRatesFetcherOptions extends RatesFetcherOpts {
  url: string;
}

// Map CurrencyID to the corresponding key from Boltz's API
export const boltzPairsMap = (currency: CurrencyID) => {
  switch (currency) {
    case CurrencyID.BTC:
      return 'BTC';
    case CurrencyID.LIGHTNING_BTC:
      return 'BTC';
    case CurrencyID.LTC:
      return 'LTC';
    case CurrencyID.LIGHTNING_LTC:
      return 'LTC';
    case CurrencyID.ETH:
      return 'ETH';
    case CurrencyID.ETH_USDT:
      return 'USDT';
    default:
      throw new Error('currency not supported by Boltz API');
  }
};

// Map CurrencyID to a boolean whether it's on on-chain or off-chain
const isCurrencyOnChain = (currency: CurrencyID) => {
  switch (currency) {
    case CurrencyID.BTC:
    case CurrencyID.LTC:
      return true;
    case CurrencyID.ETH:
      return true;
    case CurrencyID.ETH_USDT:
      return true;
    case CurrencyID.LIGHTNING_BTC:
      return false;
    case CurrencyID.LIGHTNING_LTC:
      return false;
    default:
      throw new Error('unsupported CurrencyID - this should not happen');
  }
};

export const getAmountOut = (
  { currency: inputCurrency, amount: inputAmount }: CurrencyAmount,
  pair: CurrencyPair,
  rates: BoltzGetRatesResponse,
  fixedSendAmount: boolean
): AmountPreview => {
  const outputCurrency = pair.filter(currency => currency !== inputCurrency)[0];
  if (!rates) {
    return {
      amountWithFees: {
        amount: new BigNumber('0'),
        currency: outputCurrency,
      },
    };
  }
  const inputCurrencyIsBaseAsset = !!rates.pairs[
    `${boltzPairsMap(inputCurrency)}/${boltzPairsMap(outputCurrency)}`
  ];
  const { rate, fees } = inputCurrencyIsBaseAsset
    ? rates.pairs[
        `${boltzPairsMap(inputCurrency)}/${boltzPairsMap(outputCurrency)}`
      ]
    : rates.pairs[
        `${boltzPairsMap(outputCurrency)}/${boltzPairsMap(inputCurrency)}`
      ];
  // We have 4 paths here now
  // 1. I want to send X quote asset and receive Y base asset
  // 2. I want to send X base asset and receive Y quote asset
  // 3. I want to receive X quote asset and send Y base asset
  // 4. I want to receive X base asset and send ? quote asset
  let outputAmountWithoutFees: BigNumber;
  let minerFees;
  if (
    (fixedSendAmount && inputCurrencyIsBaseAsset) ||
    (!fixedSendAmount && inputCurrencyIsBaseAsset)
  ) {
    // send fixed base asset
    // receive fixed base asset
    outputAmountWithoutFees = new BigNumber(rate).multipliedBy(inputAmount);
    // paying fees in quote asset
    minerFees = fees.minerFees.quoteAsset;
  } else {
    // send fixed quote asset
    // receive fixed quote asset
    outputAmountWithoutFees = inputAmount.div(new BigNumber(rate));
    // paying fees in base asset
    minerFees = fees.minerFees.baseAsset;
  }
  const nominalPercentageFee = new BigNumber(fees.percentage)
    .div(new BigNumber('100'))
    .multipliedBy(outputAmountWithoutFees);
  const sendingOnChain = fixedSendAmount
    ? isCurrencyOnChain(inputCurrency)
    : isCurrencyOnChain(outputCurrency);
  const getFixedMinerFees = () => {
    const SATOSHIS_PER_COIN = new BigNumber('10').pow('8');
    if (sendingOnChain) {
      // sending on-chain only includes 1 fee (for Boltz to claim the funds)
      return new BigNumber(minerFees.normal).div(SATOSHIS_PER_COIN);
    }
    // sending off-chain includes 2 fees (claim and lockup)
    return new BigNumber(minerFees.reverse.claim)
      .div(SATOSHIS_PER_COIN)
      .plus(new BigNumber(minerFees.reverse.lockup).div(SATOSHIS_PER_COIN));
  };
  const fixedMinerFee = getFixedMinerFees();
  let outputAmount: BigNumber;
  if (fixedSendAmount) {
    // sending fixed input asset - subtracting fees from output asset
    outputAmount = outputAmountWithoutFees
      .minus(nominalPercentageFee)
      .minus(fixedMinerFee);
  } else {
    // receiving fixed input asset - adding fees to output asset
    outputAmount = outputAmountWithoutFees
      .plus(nominalPercentageFee)
      .plus(fixedMinerFee);
  }
  return {
    amountWithFees: {
      amount: outputAmount,
      currency: outputCurrency,
    },
    // MVP: skipping fee details
    // feesDetail: {},
  };
};

type BoltzPair = {
  fees: {
    percentage: number;
    minerFees: {
      baseAsset: {
        normal: number;
        reverse: {
          claim: number;
          lockup: number;
        };
      };
      quoteAsset: {
        normal: number;
        reverse: {
          claim: number;
          lockup: number;
        };
      };
    };
  };
  rate: number;
  limits: {
    maximal: number;
    minimal: number;
    /* TODO: implement later
    maximalZeroConf: {
      baseAsset: number; // number
      quoteAsset: number; // number
    };
  */
  };
};

type BoltzGetRatesResponse = {
  pairs: Record<string, BoltzPair>;
};

export default class BoltzFetcher implements RatesFetcher {
  private rates$: Observable<BoltzGetRatesResponse>;
  private rates$subscription: Subscription;

  constructor(options: BoltzRatesFetcherOptions) {
    // update rates every 15000ms
    this.rates$ = interval(15000).pipe(
      // emit immediately
      startWith(0),
      mergeMap(() => {
        return fromFetch(options.url).pipe(
          // stop processing the old pairs response when a new one comes in
          switchMap(response => {
            if (response.ok) {
              // OK return data
              return from(response.json());
            }
            console.warn('Response code from Boltz API is not OK');
            return of(null);
          }),
          catchError(err => {
            console.warn('Network or other error from Boltz API', err);
            return of(null);
          }),
          // share the subscription and replay 1 latest events to late subscribers
          shareReplay({ bufferSize: 1, refCount: true })
        );
      })
    );
    this.rates$subscription = this.rates$.subscribe(() => {});
  }

  // PreviewGivenSend wants the sending amount and the currency entered by the user and will return the
  // amount to be received of the opposite currency in the pair, included of fees.
  public previewGivenSend(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair
  ): Promise<AmountPreview> {
    // get the latest rates event stream
    return this.rates$
      .pipe(
        map(rates => getAmountOut(amountWithCurrency, pair, rates, true)),
        take(1) // take 1 event and unsubscribe so that the promise can complete
      )
      .toPromise();
  }

  // PreviewGivenReceive wants the receving amount and the currency entered by the user and will return the
  // amount to be sent of the opposite currency in the pair, included of fees.
  public previewGivenReceive(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair
  ): Promise<AmountPreview> {
    // get the latest rates event stream
    return this.rates$
      .pipe(
        map(rates => getAmountOut(amountWithCurrency, pair, rates, false)),
        take(1) // take 1 event and unsubscribe so that the promise can complete
      )
      .toPromise();
  }

  // define which trading pair is supported by the fetcher implementation
  public isPairSupported(pair: CurrencyPair): boolean {
    return true;
  }

  public getLimits(pair: CurrencyPair): Promise<Limits> {
    return this.rates$
      .pipe(
        map(rates => {
          const base = boltzPairsMap(pair[0]);
          const quote = boltzPairsMap(pair[1]);
          const rate: BoltzPair =
            rates.pairs[`${base}/${quote}`] || rates[`${quote}/${base}`];
          const limits = {
            minimal: new BigNumber(rate.limits.minimal).dividedBy(10 ** 8),
            maximal: new BigNumber(rate.limits.maximal).dividedBy(10 ** 8),
          };
          return limits;
        }),
        take(1)
      )
      .toPromise();
  }

  public clean(): void {
    this.rates$subscription.unsubscribe();
  }
}
