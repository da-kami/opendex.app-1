import Decimal from 'decimal.js';
import { MoneroAmount } from './MoneroAmount';

export class BitcoinAmount {
  static readonly decimals: number = 8;
  static readonly satsInOneBtc: Decimal = new Decimal(10).pow(
    new Decimal(BitcoinAmount.decimals)
  );

  private readonly satoshis: Decimal;

  private constructor(satoshis: number | string | Decimal) {
    this.satoshis = new Decimal(satoshis);
  }

  public static fromSat(satoshis: number | string): BitcoinAmount {
    return new BitcoinAmount(satoshis);
  }

  public static fromBtc(btc: number | string): BitcoinAmount {
    return new BitcoinAmount(new Decimal(btc).mul(BitcoinAmount.satsInOneBtc));
  }

  public static fromBtcRateAndAmount(
    rate: BitcoinAmount,
    xmr: MoneroAmount
  ): BitcoinAmount {
    let piconeros_to_sat_adjust = new Decimal(10).pow(new Decimal(4));
    let xmr_as_sat = xmr.asPic().div(piconeros_to_sat_adjust);
    let sats = xmr_as_sat.mul(rate.asSat()).div(this.satsInOneBtc);

    return new BitcoinAmount(sats);
  }

  public asSat(): Decimal {
    return this.satoshis;
  }

  public asBtc(): Decimal {
    return this.satoshis.div(BitcoinAmount.satsInOneBtc);
  }

  // Returns satoshis to precision (i.e. no decimal places)
  // This is to be used when actually using the amounts against a blockchain client.
  public toPrecision(): Decimal {
    return this.satoshis.toDecimalPlaces(0);
  }

  public toBtcString(): string {
    return this.asBtc().toDecimalPlaces(BitcoinAmount.decimals).toString();
  }
}
