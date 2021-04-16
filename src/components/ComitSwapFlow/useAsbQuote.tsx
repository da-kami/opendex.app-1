import { useState } from 'react';
import useAsb, { Quote } from './useAsb';
import { useInterval } from 'react-use';

export default function useAsbQuote() {
  const asb = useAsb();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useInterval(
    async () => {
      if (asb) {
        try {
          const quote = await asb.quote();
          console.log('received quote: ' + JSON.stringify(quote));
          setQuote(quote);
        } catch (e) {
          setError(new Error('Error when fetching quote: ' + e.toString()));
        }
      }
    },
    asb ? 5000 : null
  );

  return { quote, error };
}
