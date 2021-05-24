import { useEffect, useState } from 'react';
import { BOLTZ_GET_PAIRS_API_URL } from '../api/boltzApiUrls';
import { useBoltzConfiguration } from '../context/NetworkContext';
import BoltzFetcher from './boltzRates';
import { RatesFetcher } from './rates';

export default function useBoltzFetcher(): RatesFetcher | null {
  const [fetcher, setFetcher] = useState<RatesFetcher | null>(null);
  const { apiEndpoint } = useBoltzConfiguration();
  const url = BOLTZ_GET_PAIRS_API_URL(apiEndpoint);

  useEffect(() => {
    const boltzFetcher = new BoltzFetcher({
      url,
    });
    setFetcher(boltzFetcher);
    return () => boltzFetcher.clean();
  }, [url]);

  return fetcher;
}
