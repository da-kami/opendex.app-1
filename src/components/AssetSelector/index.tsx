import { createStyles, makeStyles } from '@material-ui/core/styles';
import Skeleton from '@material-ui/lab/Skeleton';
import React from 'react';
import { CurrencyOptions } from '../../constants/currency';
import SelectComponent from '../Select';
import NumberField from '../NumberField';

const useStyles = makeStyles(() =>
  createStyles({
    selectAsset: {
      width: '8rem',
      '& .MuiSelect-select:focus': {
        'background-color': 'inherit',
      },
      '& .MuiSelect-root': {
        display: 'flex',
        alignItems: 'center',
      },
    },
  })
);

const AssetSelector = props => {
  const classes = useStyles();
  const {
    label,
    value,
    onAmountChange,
    onAssetChange,
    selectedAsset,
    placeholder,
    loading,
    error,
  } = props;

  return loading ? (
    <Skeleton variant="text" height={58} animation={'wave'} />
  ) : (
    <NumberField
      label={label}
      value={value}
      onChange={onAmountChange}
      autoFocus
      fullWidth
      placeholder={placeholder}
      error={!!error}
      helperText={error}
      InputProps={{
        endAdornment: (
          <SelectComponent
            disableUnderline
            className={classes.selectAsset}
            options={CurrencyOptions}
            onChange={onAssetChange}
            value={selectedAsset}
          />
        ),
      }}
      InputLabelProps={{
        shrink: true,
      }}
    />
  );
};

export default AssetSelector;
