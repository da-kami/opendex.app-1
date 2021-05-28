import getCurrencyLabel from '../utils/getCurrencyLabel';
import Transport, {
  TransportChain,
  TransportLayer,
  TransportExtraType,
} from './transport';

// this was the old Currency enum basically, it was mixing many domains together:
// the blockchain used, the layer and also the name of the token/currency
// Now is just the human readbale name of the currency and information about transport
// the idea is to have just the <ticker> when obvious (ie. native token ot the chain)
// in other cases <transport>_<ticker>
// it's not meant to be "machine redadable" netither for user consumption just an internal ID
export enum CurrencyID {
  BTC = 'BTC',
  LIGHTNING_BTC = 'Lightning BTC',
  LIQUID_BTC = 'Liquid BTC',
  LTC = 'LTC',
  LIGHTNING_LTC = 'Lightning LTC',
  ETH = 'ETH',
  ETH_USDT = 'Ethereum USDt', // this become "Ethterum USDt" to be consistent
  MONERO = 'XMR',
  LIQUID_USDT = 'Liquid USDt',
}

// this allows to export currency as Currency in other places in the codebase
export default CurrencyID;

// CurrencyInterface is the TS interface that defines how an actual currency
// data structure should be created: it adds the new Transport interface only
// the other fields are backward compatible with CurrencyOption type
// NOTICE: name is not an unique identifier, being Bitcoin or Tether present
// on multiple chains and layers combination. Best way would be to renamig it to just "currency" or "name"
// to uniquely identify that token/currency id + transport should be taken into consideration instead
// what swapValues.type was trying to do it has been replaced by the Transport abstraction
export interface CurrencyInterface {
  id: CurrencyID;
  name: CurrencyName;
  symbol: string;
  transport: Transport;
}

// CurrencyOption defines the interface of the currency available for trading
// It extends the CurrencyInterface and adds the swapValues for for backward compatibility
// NOTICE: components could start looking to the more scalable Transport instead
export interface CurrencyOption extends CurrencyInterface {
  label: JSX.Element;
  swapValues: {
    label: string;
    type: CurrencyType;
  };
}

// this new Currency enum  only defines the token/currency
// it does not depened on the underlying chain/layer.
// this allows to grow the assets and to abstract the underlying technicalities
// ie. BTC is still BTC even if use send via Lightning or Liquid
export enum CurrencyName {
  BTC = 'Bitcoin',
  LTC = 'Litecoin',
  USDT = 'Tether USD',
  ETH = 'Ether',
  MONERO = 'Monero',
}

// old: kept for backward compatibility only to maintain swapValues
export enum CurrencyType {
  Ether = 'Ether',
  ERC20 = 'ERC20',
  Lightning = 'Lightning',
  BitcoinLike = 'BitcoinLike',
  Monero = 'Monero',
  Liquid = 'Liquid',
}

export const CurrencyByID: Record<CurrencyID, CurrencyOption> = {
  [CurrencyID.BTC]: {
    id: CurrencyID.BTC,
    name: CurrencyName.BTC,
    symbol: 'BTC',
    label: getCurrencyLabel('Bitcoin', 'Bitcoin'),
    transport: {
      chain: TransportChain.BITCOIN,
      layer: TransportLayer.ONCHAIN,
    },
    swapValues: {
      label: 'Bitcoin',
      type: CurrencyType.BitcoinLike,
    },
  },
  [CurrencyID.LIGHTNING_BTC]: {
    id: CurrencyID.LIGHTNING_BTC,
    name: CurrencyName.BTC,
    symbol: 'BTC',
    label: getCurrencyLabel('LN-BTC', 'LightningBitcoin'),
    transport: {
      chain: TransportChain.BITCOIN,
      layer: TransportLayer.LIGHTNING,
    },
    swapValues: {
      label: 'Bitcoin Lightning',
      type: CurrencyType.Lightning,
    },
  },
  [CurrencyID.LIQUID_BTC]: {
    id: CurrencyID.LIQUID_BTC,
    name: CurrencyName.BTC,
    symbol: 'L-BTC',
    label: getCurrencyLabel('L-BTC', 'LiquidBitcoin'),
    transport: {
      chain: TransportChain.LIQUID,
      layer: TransportLayer.ONCHAIN,
    },
    swapValues: {
      label: 'Bitcoin Liquid',
      type: CurrencyType.Liquid,
    },
  },
  [CurrencyID.LIQUID_USDT]: {
    id: CurrencyID.LIQUID_USDT,
    name: CurrencyName.USDT,
    symbol: 'USDt',
    transport: {
      chain: TransportChain.LIQUID,
      layer: TransportLayer.ONCHAIN,
    },
    label: getCurrencyLabel('L-USDt', 'Tether'),
    swapValues: {
      label: 'Tether Liquid',
      type: CurrencyType.Liquid,
    },
  },
  [CurrencyID.ETH]: {
    id: CurrencyID.ETH,
    name: CurrencyName.ETH,
    symbol: 'ETH',
    label: getCurrencyLabel('Ether', 'Ether'),
    transport: {
      chain: TransportChain.ETHEREUM,
      layer: TransportLayer.ONCHAIN,
      extraType: TransportExtraType.Ether,
    },
    swapValues: {
      label: 'Ether',
      type: CurrencyType.Ether,
    },
  },
  [CurrencyID.ETH_USDT]: {
    id: CurrencyID.ETH_USDT,
    name: CurrencyName.USDT,
    symbol: 'USDT',
    label: getCurrencyLabel('USDT', 'Tether'),
    transport: {
      chain: TransportChain.ETHEREUM,
      layer: TransportLayer.ONCHAIN,
      extraType: TransportExtraType.ERC20,
    },
    swapValues: {
      label: 'Tether',
      type: CurrencyType.ERC20,
    },
  },
  [CurrencyID.LTC]: {
    id: CurrencyID.LTC,
    name: CurrencyName.LTC,
    symbol: 'LTC',
    label: getCurrencyLabel('Litecoin', 'Litecoin'),
    transport: {
      chain: TransportChain.LITECOIN,
      layer: TransportLayer.ONCHAIN,
    },
    swapValues: {
      label: 'Litecoin',
      type: CurrencyType.BitcoinLike,
    },
  },
  [CurrencyID.LIGHTNING_LTC]: {
    id: CurrencyID.LIGHTNING_LTC,
    name: CurrencyName.LTC,
    symbol: 'LTC',
    label: getCurrencyLabel('LN-LTC', 'LightningLitecoin'),
    transport: {
      chain: TransportChain.LITECOIN,
      layer: TransportLayer.LIGHTNING,
    },
    swapValues: {
      label: 'Litecoin Lightning',
      type: CurrencyType.Lightning,
    },
  },
  [CurrencyID.MONERO]: {
    id: CurrencyID.MONERO,
    name: CurrencyName.MONERO,
    symbol: 'XMR',
    label: getCurrencyLabel('Monero', 'Monero'),
    transport: {
      chain: TransportChain.MONERO,
      layer: TransportLayer.ONCHAIN,
    },
    swapValues: {
      label: 'Monero',
      type: CurrencyType.Monero,
    },
  },
};
export const CurrencyOptions: CurrencyOption[] = Object.values(CurrencyByID);

export type FundTransferType = {
  id: string;
  value: string;
};

type FundTransferTypes = {
  [key: string]: FundTransferType[];
};

export const fundTransferTypes: FundTransferTypes = {
  BTC: [
    {
      id: 'Sats',
      value: '1',
    },
    {
      id: 'BTC',
      value: '2',
    },
  ],
  LTC: [
    {
      id: 'Litoshi',
      value: '1',
    },
    {
      id: 'LTC',
      value: '2',
    },
  ],
  ETH: [
    {
      id: 'Ether',
      value: '2',
    },
  ],
  USDT: [
    {
      id: 'USDT',
      value: '2',
    },
  ],
};
