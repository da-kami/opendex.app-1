import React, { ReactElement, useState } from 'react';
import { Box, InputLabel, TextField } from '@material-ui/core';
import useAsbQuote from './useAsbQuote';
import useDownloadUrl from './useDownloadUrl';
import { getOs, OS } from './utils';
import { ASB_MULTI_ADR, ASB_PEER_ID } from './useAsb';

const ComitSwapFlow = (): ReactElement => {
  const { quote, error } = useAsbQuote();
  const downloadUrl = useDownloadUrl();

  const [moneroAddress, setMoneroAddress] = useState<string>('');

  let swapExecCommand = './swap';
  if (getOs() === OS.WINDOWS) {
    swapExecCommand = 'start /b "swap" swap.exe';
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!quote) {
    return <div>Loading latest price...</div>;
  }

  return (
    <div>
      <Box component="span" display="block" p={1} m={1}>
        Current BTC price: 1 XMR = {quote.price.toString()}
      </Box>
      <Box component="span" display="block" p={1} m={1}>
        Maximum quantity tradable: {quote.max_quantity.toString()}
      </Box>
      <Box component="span" display="block" p={1} m={1}>
        <a href={downloadUrl} download>
          Download swap CLI
        </a>
      </Box>

      <Box component="span" display="block" p={1} m={1}>
        Enter Monero stagenet address where you receive XMR:
        <Box component="span" display="block" mt={1}>
          <TextField
            label="Your Monero stagenet wallet address"
            fullWidth={true}
            value={moneroAddress}
            onChange={event => {
              setMoneroAddress(event.target.value);
            }}
          />
        </Box>
      </Box>
      <Box component="span" display="block" p={1} m={1}>
        Command to execute (*):
        <Box component="span" display="block" mt={1}>
          <InputLabel>
            {swapExecCommand} buy-xmr --seller-addr {ASB_MULTI_ADR.toString()}{' '}
            --seller-peer-id {ASB_PEER_ID.toString()} --receive-address{' '}
            {moneroAddress}
          </InputLabel>
        </Box>
        (*) Assumes that you are in the folder where you downloaded and unpacked
        the binary!
      </Box>
    </div>
  );
};

export default ComitSwapFlow;
