import Libp2p from 'libp2p';
import { NOISE } from 'libp2p-noise';
import filters from 'libp2p-websockets/src/filters';
import { Multiaddr } from 'multiaddr';
import PeerId from 'peer-id';
import WebSockets from 'libp2p-websockets';
import MPLEX from 'libp2p-mplex';
import { BitcoinAmount } from './BitcoinAmount';
import wrap from 'it-pb-rpc';
import { Network } from '../../context/NetworkContext';

const QUOTE_PROTOCOL = '/comit/xmr/btc/bid-quote/1.0.0';

// TODO: Mainnet address
const ASB_MULTI_ADR = '/dnsaddr/xmr-btc-asb.coblox.tech';
const ASB_PEER_ID = '12D3KooWCdMKjesXMJz1SiZ7HgotrxuqhQJbP5sgBm2BwP1cqThi';

const ASB_MULTI_ADR_TESTNET = '/dnsaddr/xmr-btc-asb.coblox.tech';
const ASB_PEER_ID_TESTNET =
  '12D3KooWCdMKjesXMJz1SiZ7HgotrxuqhQJbP5sgBm2BwP1cqThi';

export function getPeerIdForNetwork(network: Network): PeerId {
  return network === Network.Mainnet
    ? PeerId.createFromB58String(ASB_PEER_ID)
    : PeerId.createFromB58String(ASB_PEER_ID_TESTNET);
}

export function getMultiaddrForNetwork(network: Network): Multiaddr {
  return network === Network.Mainnet
    ? new Multiaddr(ASB_MULTI_ADR)
    : new Multiaddr(ASB_MULTI_ADR_TESTNET);
}

const transportKey = WebSockets.prototype[Symbol.toStringTag];

export class Quote {
  price: BitcoinAmount;
  max_quantity: BitcoinAmount;
  timestamp: Date;

  constructor(price: number, max_quantity: number) {
    this.price = BitcoinAmount.fromSat(price);
    this.max_quantity = BitcoinAmount.fromSat(max_quantity);
    this.timestamp = new Date();
  }
}

// TODO: Change the ASB to send strings over the wire
interface QuoteResponse {
  price: number;
  max_quantity: number;
}

const jsonCodec = {
  encode: msg => {
    return Buffer.from(JSON.stringify(msg));
  },
  decode: bytes => {
    return JSON.parse(bytes.toString());
  },
};

export class Asb {
  private constructor(private libp2p: Libp2p, private peerId: PeerId) {}

  public static async newInstance(network: Network): Promise<Asb> {
    let multiaddr = getMultiaddrForNetwork(network);
    let peerId = getPeerIdForNetwork(network);

    const node = await Libp2p.create({
      modules: {
        transport: [WebSockets],
        connEncryption: [NOISE],
        streamMuxer: [MPLEX],
      },
      config: {
        transport: {
          [transportKey]: {
            // in order to allow IP-addresses as part of the multiaddress we set the filters to all
            filter: filters.all,
          },
        },
      },
    });

    await node.start();
    node.peerStore.addressBook.add(peerId, [multiaddr]);

    return new Asb(node, peerId);
  }

  public async quote(): Promise<Quote> {
    try {
      const { stream } = await this.libp2p.dialProtocol(
        this.peerId,
        QUOTE_PROTOCOL
      );
      let quote: QuoteResponse = await wrap(stream).pb(jsonCodec).read();

      await stream.close();

      return new Quote(quote.price, quote.max_quantity);
    } catch (e) {
      if (e instanceof Error && e.message.includes('No transport available')) {
        // Since we have set the transport `filters` to `all` so we can use ip-addresses to connect,
        // we can run into the problem that we try to connect on a port that is not configured for
        // websockets if connecting on the websocket address fails. In this case we just log a warning.
        console.warn('skipping port that is not configured for websockets');
      } else {
        throw e;
      }
    }

    throw Error('All attempts to fetch a quote failed.');
  }
}
