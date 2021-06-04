import { BitcoinAmount } from './BitcoinAmount';
import { Network } from '../../context/NetworkContext';

// TODO: Community member to plug in mainnet address
const MAINNET_ONION = 'tbd';
const QUOTE_WS = 'ws://' + MAINNET_ONION + '.onion:3030/api/quote/xmr-btc';
const ASB_MULTI_ADR = '/onion3/' + MAINNET_ONION + ':9939';
// TODO: Community member to plug in mainnet peer-id
const ASB_PEER_ID = 'tbd';

const TESTNET_ONION =
  'ac4hgzmsmekwekjbdl77brufqqbylddugzze4tel6qsnlympgmr46iid';
const QUOTE_WS_TESTNET =
  'ws://' + TESTNET_ONION + '.onion:3030/api/quote/xmr-btc';
const ASB_MULTI_ADR_TESTNET = '/onion3/' + TESTNET_ONION + ':9939';
const ASB_PEER_ID_TESTNET =
  '12D3KooWCdMKjesXMJz1SiZ7HgotrxuqhQJbP5sgBm2BwP1cqThi';

export function getQuoteWebsocketForNetwork(network: Network): string {
  return network === Network.Mainnet ? QUOTE_WS : QUOTE_WS_TESTNET;
}

export function getPeerIdForNetwork(network: Network): string {
  return network === Network.Mainnet ? ASB_PEER_ID : ASB_PEER_ID_TESTNET;
}

export function getMultiaddrForNetwork(network: Network): string {
  return network === Network.Mainnet ? ASB_MULTI_ADR : ASB_MULTI_ADR_TESTNET;
}

export function intoQuote(response: any): Quote | Error {
  if (response.toString().includes('Error')) {
    return new Error(response.Error);
  } else {
    let quoteRes = response.Quote as QuoteResponse;
    return new Quote(
      quoteRes.price,
      quoteRes.min_quantity,
      quoteRes.max_quantity
    );
  }
}

export class Quote {
  price: BitcoinAmount;
  min_quantity: BitcoinAmount;
  max_quantity: BitcoinAmount;
  timestamp: Date;

  constructor(price: number, min_quantity: number, max_quantity: number) {
    this.price = BitcoinAmount.fromSat(price);
    this.min_quantity = BitcoinAmount.fromSat(min_quantity);
    this.max_quantity = BitcoinAmount.fromSat(max_quantity);
    this.timestamp = new Date();
  }
}

// TODO: Change the ASB to send strings over the wire
interface QuoteResponse {
  price: number;
  min_quantity: number;
  max_quantity: number;
}
