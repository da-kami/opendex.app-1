import { useState, useEffect } from 'react';
import { RatesFetcher } from './rates';
import BoltzFetcher from './boltzRates';
import { useNetwork } from '../context/NetworkContext';
import { BOLTZ_GET_PAIRS_API_URL } from '../api/boltzApiUrls';

export default function useBoltzFetcher(): RatesFetcher | null {
  const [fetcher, setFetcher] = useState<RatesFetcher | null>(null);
  const { network } = useNetwork();
  const url = BOLTZ_GET_PAIRS_API_URL(network);

  useEffect(() => {
    const boltzFetcher = new BoltzFetcher({
      url,
    });
    setFetcher(boltzFetcher);
    return () => boltzFetcher.clean();
  }, [url]);

  return fetcher;
}
