import { Box, MenuItem, TextField } from '@material-ui/core';
import { Network, useNetwork } from '../../context/NetworkContext';
import React from 'react';

const NetworkSelection = () => {
  const { network, setNetwork } = useNetwork();

  return (
    <Box style={{ marginTop: '2rem' }}>
      <TextField
        select
        className={'currency-options'}
        value={network}
        onChange={event => {
          setNetwork(event.target.value! as Network);
        }}
        variant={'outlined'}
        SelectProps={{ MenuProps: { disableScrollLock: true } }}
      >
        {Object.entries(Network).map(([key, value]) => (
          <MenuItem key={key} value={value}>
            {key}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default NetworkSelection;
