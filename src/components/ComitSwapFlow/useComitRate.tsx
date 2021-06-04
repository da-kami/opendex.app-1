import { useEffect, useState } from 'react';
import { XmrBtcRateFetcher } from './XmrBtcRateFetcher';
import { getQuoteWebsocketForNetwork, intoQuote, Quote } from './Asb';
import { useNetwork } from '../../context/NetworkContext';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export default function useComitRate(): {
  rateFetcher: XmrBtcRateFetcher | null;
  latestQuote: Quote | null;
  error: Error | null;
} {
  let [quote, setQuote] = useState<{
    quote: Quote | null;
    error: Error | null;
  }>({ quote: null, error: null });

  let [xmrBtcRateFetcher, setXmrBtcRateFetcher] =
    useState<XmrBtcRateFetcher | null>(null);

  const { network } = useNetwork();

  let quoteWsAddr = getQuoteWebsocketForNetwork(network);
  const { lastJsonMessage, readyState } = useWebSocket(quoteWsAddr);

  if (!xmrBtcRateFetcher) {
    setXmrBtcRateFetcher(new XmrBtcRateFetcher(null, null));
  }

  useEffect(() => {
    if (!xmrBtcRateFetcher) {
      return;
    }

    if (readyState === ReadyState.OPEN && lastJsonMessage) {
      let quoteOrError = intoQuote(lastJsonMessage);
      if (quoteOrError instanceof Quote) {
        setQuote({ quote: quoteOrError, error: null });
        xmrBtcRateFetcher.updateQuote(quoteOrError);
      } else {
        setQuote({ quote: null, error: quoteOrError });
        xmrBtcRateFetcher.updateError(quoteOrError);
      }
    } else if (readyState === ReadyState.CONNECTING) {
      setQuote({
        quote: null,
        error: new Error('Waiting for latest price...'),
      });
      xmrBtcRateFetcher.updateQuote(null);
    } else if (readyState === ReadyState.CLOSED) {
      setQuote({
        quote: null,
        error: new Error('Failed to fetch latest price'),
      });
      xmrBtcRateFetcher.updateQuote(null);
    }
  }, [readyState, lastJsonMessage, xmrBtcRateFetcher]);

  return {
    rateFetcher: xmrBtcRateFetcher,
    latestQuote: quote.quote ? quote.quote : null,
    error: quote.error ? quote.error : null,
  };
}
