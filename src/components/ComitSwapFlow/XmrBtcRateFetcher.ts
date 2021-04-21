import CurrencyID from '../../constants/currency';
import { BitcoinAmount } from './BitcoinAmount';
import { MoneroAmount } from './MoneroAmount';
import { Asb, Quote } from './Asb';
import {
  AmountPreview,
  CurrencyAmount,
  CurrencyPair,
  RatesFetcher,
} from '../../constants/rates';
import BigNumber from 'bignumber.js';
import { Network } from '../../context/NetworkContext';

export class XmrBtcRateFetcher implements RatesFetcher {
  private constructor(
    private readonly asb: Asb,
    private latestQuote: Quote | null,
    private refreshError: Error | null
  ) {}

  public static async newInstance(
    network: Network
  ): Promise<XmrBtcRateFetcher> {
    let asb = await Asb.newInstance(network);
    return new XmrBtcRateFetcher(asb, null, null);
  }

  previewGivenSend(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair
  ): Promise<AmountPreview> {
    let sendCurrency = amountWithCurrency.currency;
    let receiveCurrency = pair[0] !== sendCurrency ? pair[0] : pair[1];

    this.ensureSendBtcReceiveXmr(sendCurrency, receiveCurrency);
    this.ensureNoRefreshErrors();

    let send = BitcoinAmount.fromBtc(amountWithCurrency.amount.toString());
    let price = this.getQuote().price;
    let receive = receiveAmountForSendAmount(send, price);

    let amount = new BigNumber(receive.asXmr().toString());

    return Promise.resolve({
      amountWithFees: {
        amount: amount,
        currency: CurrencyID.MONERO,
      },
    });
  }

  previewGivenReceive(
    amountWithCurrency: CurrencyAmount,
    pair: CurrencyPair
  ): Promise<AmountPreview> {
    let receiveCurrency = amountWithCurrency.currency;
    let sendCurrency = pair[0] !== receiveCurrency ? pair[0] : pair[1];

    this.ensureSendBtcReceiveXmr(sendCurrency, receiveCurrency);
    this.ensureNoRefreshErrors();

    let receive_xmr = MoneroAmount.fromXmr(
      amountWithCurrency.amount.toString()
    );

    console.log(receive_xmr.asXmr().toString());

    let send_btc = BitcoinAmount.fromBtcRateAndAmount(
      this.getQuote().price,
      receive_xmr
    );

    let amount = new BigNumber(send_btc.asBtc().toString());

    return Promise.resolve({
      amountWithFees: {
        amount: amount,
        currency: CurrencyID.BTC,
      },
    });
  }

  isPairSupported(pair: CurrencyPair): boolean {
    throw new Error('Method not implemented.');
  }

  maxQuantity(): BitcoinAmount {
    return this.getQuote().max_quantity;
  }

  async refresh(): Promise<Quote> {
    try {
      this.latestQuote = await this.asb.quote();
      console.log(this.latestQuote.price.toBtcString());
      return this.latestQuote;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // At the moment we only support send BTC receive XMR swaps, once the protocol where
  // XMR moves first is integrated this restriction will be lifted.
  private ensureSendBtcReceiveXmr(
    sendCurrency: CurrencyID,
    receiveCurrency: CurrencyID
  ) {
    if (sendCurrency !== 'BTC' || receiveCurrency !== 'XMR') {
      throw new Error(
        'Only swaps where you send BTC and receive XMR are supported at the moment'
      );
    }
  }

  private ensureNoRefreshErrors() {
    // Might want to implement more elaborate error handline strategies
    if (this.refreshError) {
      throw this.refreshError;
    }
  }

  private getQuote(): Quote {
    if (!this.latestQuote) {
      throw new Error('Quote not available');
    }

    return this.latestQuote;
  }
}

export function receiveAmountForSendAmount(
  send: BitcoinAmount,
  price: BitcoinAmount
): MoneroAmount {
  let receive = MoneroAmount.fromBtcRateAndAmount(price, send);

  return receive;
}
