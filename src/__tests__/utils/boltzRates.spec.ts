import BigNumber from 'bignumber.js';
import { getAmountOut } from '../../constants/boltzRates';
import CurrencyID from '../../constants/currency';
import { CurrencyPair } from '../../constants/rates';

const rates = {
  pairs: {
    'ETH/BTC': {
      fees: {
        percentage: 5,
        minerFees: {
          baseAsset: {
            normal: 157021,
            reverse: {
              claim: 157021,
              lockup: 292698,
            },
          },
          quoteAsset: {
            normal: 15470,
            reverse: {
              claim: 12558,
              lockup: 13923,
            },
          },
        },
      },
      rate: 0.0608543,
    },
  },
};

const LBTCETH: CurrencyPair = [CurrencyID.LIGHTNING_BTC, CurrencyID.ETH];
const ETHLTBTC: CurrencyPair = [CurrencyID.ETH, CurrencyID.LIGHTNING_BTC];

describe('getAmountOut', () => {
  test('receiving Lightning BTC', () => {
    const inputCurrencyWithAmount = {
      amount: new BigNumber('1'),
      currency: CurrencyID.LIGHTNING_BTC,
    };
    const expectedOutput = {
      amountWithFees: {
        amount: new BigNumber('17.2558973487560123113735'),
        currency: CurrencyID.ETH,
      },
    };
    expect(
      getAmountOut(inputCurrencyWithAmount, LBTCETH, rates, false)
    ).toEqual(expectedOutput);
  });

  test('receiving ETH', () => {
    const inputCurrencyWithAmount = {
      amount: new BigNumber('1'),
      currency: CurrencyID.ETH,
    };
    const expectedOutput = {
      amountWithFees: {
        amount: new BigNumber('0.064161825'),
        currency: CurrencyID.LIGHTNING_BTC,
      },
    };
    expect(
      getAmountOut(inputCurrencyWithAmount, ETHLTBTC, rates, false)
    ).toEqual(expectedOutput);
  });

  test('sending Lightning BTC', () => {
    const inputCurrencyWithAmount = {
      amount: new BigNumber('1'),
      currency: CurrencyID.LIGHTNING_BTC,
    };
    const expectedOutput = {
      amountWithFees: {
        amount: new BigNumber('15.6065606974459159007665'),
        currency: CurrencyID.ETH,
      },
    };
    expect(getAmountOut(inputCurrencyWithAmount, LBTCETH, rates, true)).toEqual(
      expectedOutput
    );
  });

  test('sending ETH', () => {
    const inputCurrencyWithAmount = {
      amount: new BigNumber('1'),
      currency: CurrencyID.ETH,
    };
    const expectedOutput = {
      amountWithFees: {
        amount: new BigNumber('0.057656885'),
        currency: CurrencyID.LIGHTNING_BTC,
      },
    };
    expect(
      getAmountOut(inputCurrencyWithAmount, ETHLTBTC, rates, true)
    ).toEqual(expectedOutput);
  });
});
