import { RatesFetcher } from '../../constants/rates';
import useComitRate from './useComitRate';

export default function useComitFetcher(): RatesFetcher | null {
  const comitRate = useComitRate();
  return comitRate.rateFetcher;
}
