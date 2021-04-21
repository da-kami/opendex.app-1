import { useState } from 'react';
import { useInterval } from 'react-use';
import { XmrBtcRateFetcher } from './XmrBtcRateFetcher';
import useAsyncEffect from 'use-async-effect';
import { Quote } from './Asb';
import { useNetwork } from '../../context/NetworkContext';

export default function useComitRate(): {
  rateFetcher: XmrBtcRateFetcher | null;
  latestQuote: Quote | null;
  error: Error | null;
} {
  let [xmrBtcRateFetcher, setXmrBtcRateFetcher] = useState<{
    rateFetcher: XmrBtcRateFetcher | null;
    error: Error | null;
  }>({ rateFetcher: null, error: null });

  let [quote, setQuote] = useState<{
    quote: Quote | null;
    error: Error | null;
  }>({ quote: null, error: null });

  const { network } = useNetwork();

  // TODO: Evaluate if this will actually be properly updated upon network change
  useAsyncEffect(async () => {
    if (!xmrBtcRateFetcher || !xmrBtcRateFetcher.rateFetcher) {
      try {
        const rateFetcher = await XmrBtcRateFetcher.newInstance(network);
        setXmrBtcRateFetcher({ rateFetcher, error: null });
      } catch (error) {
        console.error(error);
        setXmrBtcRateFetcher({ rateFetcher: null, error });
      }
    }
  }, [network]);

  // Drive the refresh rate of the XmrBtcRateFetcher and keep the latest quote internally
  useInterval(
    async () => {
      if (xmrBtcRateFetcher.rateFetcher) {
        try {
          let quote = await xmrBtcRateFetcher.rateFetcher.refresh();
          setQuote({ quote, error: null });
        } catch (error) {
          console.error(error);
          setQuote({ quote: null, error });
        }
      }
    },
    xmrBtcRateFetcher ? 5000 : null
  );

  return {
    rateFetcher: xmrBtcRateFetcher.rateFetcher
      ? xmrBtcRateFetcher.rateFetcher
      : null,
    latestQuote: quote.quote ? quote.quote : null,
    error: xmrBtcRateFetcher.error
      ? xmrBtcRateFetcher.error
      : quote.error
      ? quote.error
      : null,
  };
}
