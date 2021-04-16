import { useState } from 'react';
import Libp2p from 'libp2p';
import WebSockets from 'libp2p-websockets';
import filters from 'libp2p-websockets/src/filters';
import MPLEX from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import Multiaddr from 'multiaddr';
import PeerId from 'peer-id';
import wrap from 'it-pb-rpc';
import Decimal from 'decimal.js';
import useAsyncEffect from 'use-async-effect';

export default function useAsb() {
  let [asb, setAsb] = useState<Asb | null>(null);

  useAsyncEffect(async () => {
    if (!asb) {
      try {
        const asb = await Asb.newInstance();
        setAsb(asb);
      } catch (e) {
        console.error(e);
      }
    }
  });

  return asb;
}

export const ASB_MULTI_ADR = Multiaddr('/dnsaddr/xmr-btc-asb.coblox.tech');
export const ASB_PEER_ID = PeerId.createFromB58String(
  '12D3KooWCdMKjesXMJz1SiZ7HgotrxuqhQJbP5sgBm2BwP1cqThi'
);

const QUOTE_PROTOCOL = '/comit/xmr/btc/bid-quote/1.0.0';

const transportKey = WebSockets.prototype[Symbol.toStringTag];

export class BitcoinAmount {
  decimals: number = 8;
  adjust: Decimal;
  satoshis: Decimal;

  constructor(satoshis: number | string) {
    this.satoshis = new Decimal(satoshis);
    this.adjust = new Decimal(10).pow(new Decimal(this.decimals));
  }

  public asSat(): Decimal {
    return this.satoshis;
  }

  public asBtc(): Decimal {
    return this.satoshis.div(this.adjust);
  }

  public toString(): string {
    return this.asBtc().toString() + ' BTC';
  }
}

export class Quote {
  price: BitcoinAmount;
  max_quantity: BitcoinAmount;

  constructor(price: number, max_quantity: number) {
    this.price = new BitcoinAmount(price);
    this.max_quantity = new BitcoinAmount(max_quantity);
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
  private constructor(private libp2p: Libp2p) {}

  public static async newInstance(): Promise<Asb> {
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
    node.peerStore.addressBook.add(ASB_PEER_ID, [ASB_MULTI_ADR]);
    return new Asb(node);
  }

  public async quote(): Promise<Quote> {
    try {
      const { stream } = await this.libp2p.dialProtocol(
        ASB_PEER_ID,
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
