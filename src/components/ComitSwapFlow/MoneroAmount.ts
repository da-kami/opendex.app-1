import Decimal from 'decimal.js';
import { BitcoinAmount } from './BitcoinAmount';

export class MoneroAmount {
  static readonly decimals: number = 12;
  static readonly picsInOneXmr: Decimal = new Decimal(10).pow(
    new Decimal(MoneroAmount.decimals)
  );

  private constructor(private readonly piconeros: Decimal) {
    this.piconeros = new Decimal(piconeros);
  }

  public static fromXmr(xmr: number | string) {
    return new MoneroAmount(new Decimal(xmr).mul(MoneroAmount.picsInOneXmr));
  }

  public static fromPic(pic: number | string) {
    return new MoneroAmount(new Decimal(pic));
  }

  public static fromBtcRateAndAmount(
    rate: BitcoinAmount,
    btc: BitcoinAmount
  ): MoneroAmount {
    let xmr = new Decimal(btc.asSat()).div(rate.asSat());
    return new MoneroAmount(xmr.mul(MoneroAmount.picsInOneXmr));
  }

  public asPic(): Decimal {
    return this.piconeros;
  }

  public asXmr(): Decimal {
    return this.piconeros.div(MoneroAmount.picsInOneXmr);
  }

  // Returns piconeros to precision (i.e. no decimal places)
  // This is to be used when actually using the amounts against a blockchain client.
  public toPrecision(): Decimal {
    return this.piconeros.toDecimalPlaces(0);
  }

  public toXmrString(): string {
    return this.asXmr().toDecimalPlaces(MoneroAmount.decimals).toString();
  }
}
