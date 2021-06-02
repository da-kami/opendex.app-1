import { Direction, SwapProvider, swapProviders } from '../constants/swap';
import Currency from '../constants/currency';

export const getSwapProvider = (
  sendAsset: Currency,
  receiveAsset: Currency
): SwapProvider | undefined => {
  for (const [key, value] of Object.entries(swapProviders)) {
    if (
      value.some(
        provider_pair =>
          ((provider_pair.direction === Direction.BOTH &&
            provider_pair.pair.includes(sendAsset) &&
            provider_pair.pair.includes(receiveAsset)) ||
            (provider_pair.direction === Direction.SINGLE &&
              provider_pair.pair[0] === sendAsset &&
              provider_pair.pair[1] === receiveAsset)) &&
          (sendAsset !== receiveAsset ||
            provider_pair.pair[0] === provider_pair.pair[1])
      )
    ) {
      return key as SwapProvider;
    }
  }
};
