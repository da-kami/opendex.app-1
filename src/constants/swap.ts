import { CurrencyID } from './currency';
import { CurrencyPair } from './rates';

export enum SwapProvider {
  BOLTZ = 'Boltz',
  COMIT = 'Comit',
  TDEX = 'TDex',
}

export enum Direction {
  SINGLE,
  BOTH,
}

export class SwapProviderPair {
  public constructor(
    public pair: CurrencyPair,
    public direction: Direction = Direction.BOTH
  ) {}
}

export const swapProviders = {
  [SwapProvider.BOLTZ]: [
    new SwapProviderPair([CurrencyID.BTC, CurrencyID.LIGHTNING_BTC]),
    new SwapProviderPair([CurrencyID.BTC, CurrencyID.LIGHTNING_LTC]),
    new SwapProviderPair([CurrencyID.ETH, CurrencyID.LIGHTNING_BTC]),
    new SwapProviderPair([CurrencyID.ETH_USDT, CurrencyID.LIGHTNING_BTC]),
    new SwapProviderPair([CurrencyID.LTC, CurrencyID.LIGHTNING_BTC]),
    new SwapProviderPair([CurrencyID.LTC, CurrencyID.LIGHTNING_LTC]),
  ],
  [SwapProvider.COMIT]: [
    new SwapProviderPair([CurrencyID.BTC, CurrencyID.MONERO], Direction.SINGLE),
  ],
  [SwapProvider.TDEX]: [
    new SwapProviderPair([CurrencyID.LIQUID_BTC, CurrencyID.LIQUID_USDT]),
  ],
};

export enum SwapStep {
  CHOOSE_PAIR,
  SWAP_FLOW,
}
