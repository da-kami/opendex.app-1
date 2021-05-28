import {
  createStyles,
  Grid,
  makeStyles,
  MenuItem,
  Select,
} from '@material-ui/core';
import BigNumber from 'bignumber.js';
import React, { ReactElement, useEffect } from 'react';
import { boltzPairsMap } from '../../constants/boltzRates';
import CurrencyID, { fundTransferTypes } from '../../constants/currency';
import { selectUnit, setUnit } from '../../store/boltz-slice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

type BoltzAmountProps = {
  amountInMainUnit: string;
  currency: CurrencyID;
  onDisplayedAmountChange?: (amount: string) => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    input: {
      borderRadius: 0,
    },
    selectInput: {
      borderRadius: 0,
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem',
    },
    amountRow: {
      marginTop: '0.5rem',
    },
    amountContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    unitContainer: {
      display: 'flex',
      justifyContent: 'flex-start',
    },
  })
);

const BoltzAmount = (props: BoltzAmountProps): ReactElement => {
  const { amountInMainUnit, currency, onDisplayedAmountChange } = props;
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const units = useAppSelector(selectUnit);

  const unitOptions = fundTransferTypes[boltzPairsMap(currency)];

  const getUnit = () => {
    return units[boltzPairsMap(currency)] || unitOptions[0];
  };

  const displayedAmount =
    getUnit().value === '2'
      ? amountInMainUnit
      : new BigNumber(amountInMainUnit).multipliedBy(10 ** 8).toString();

  useEffect(() => {
    if (onDisplayedAmountChange) {
      onDisplayedAmountChange(displayedAmount);
    }
  }, [displayedAmount, onDisplayedAmountChange]);

  return (
    <Grid
      item
      container
      spacing={1}
      alignItems="center"
      justify="center"
      className={classes.amountRow}
    >
      <Grid item xs={6} className={classes.amountContainer}>
        {displayedAmount}
      </Grid>
      <Grid item xs={6} className={classes.unitContainer}>
        <Select
          variant="outlined"
          className={classes.input}
          inputProps={{ className: classes.selectInput }}
          value={getUnit().id}
          onChange={e => {
            const selected = unitOptions.find(
              opt => opt.id === e.target.value
            )!;
            dispatch(setUnit({ [boltzPairsMap(currency)]: selected }));
          }}
        >
          {unitOptions.map(option => (
            <MenuItem key={option.value} value={option.id}>
              {option.id}
            </MenuItem>
          ))}
        </Select>
      </Grid>
    </Grid>
  );
};

export default BoltzAmount;
