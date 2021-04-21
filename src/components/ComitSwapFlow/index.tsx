import React, { ReactElement, useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  ClickAwayListener,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import useDownloadUrl from './useDownloadUrl';
import { getOs, OS } from './utils';
import { RootState } from '../../store';
import { useAppSelector } from '../../store/hooks';
import useComitRate from './useComitRate';
import { receiveAmountForSendAmount } from './XmrBtcRateFetcher';
import { getMultiaddrForNetwork, getPeerIdForNetwork } from './Asb';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { BitcoinAmount } from './BitcoinAmount';
import { Network, useNetwork } from '../../context/NetworkContext';

const ComitSwapFlow = (): ReactElement => {
  const { latestQuote: quote, error } = useComitRate();
  const downloadUrl = useDownloadUrl();

  const [copyTooltipOpen, setCopyTooltipOpen] = React.useState(false);
  const handleCopyTooltipClose = () => {
    setCopyTooltipOpen(false);
  };
  const handleCopyTooltipOpen = () => {
    setCopyTooltipOpen(true);
  };

  const { network } = useNetwork();
  const classes = useStyles();

  // We only care about the send amount
  // The receive amount it calculated internally in this component independent of what is displayed in ChooseTradingPair
  const { sendAmount, sendAsset } = useAppSelector(
    (state: RootState) => state.swaps
  );

  const [moneroAddress, setMoneroAddress] = useState<string>('');
  const [validMoneroAddress, setValidMoneroAddress] =
    useState<string | null>(null);

  useEffect(() => {
    setValidMoneroAddress(null);
    setMoneroAddress('');
  }, [network]);

  let monero_address_regex_str_testnet = '^5([0-9]|[A-B])(.){93}';
  let monero_address_regex_str = '^4([0-9]|[A-B])(.){93}';
  let monero_address_regex = new RegExp(
    network === Network.Mainnet
      ? monero_address_regex_str
      : monero_address_regex_str_testnet
  );

  let swapExecCommand = './swap';
  if (getOs() === OS.WINDOWS) {
    swapExecCommand = 'start /b "swap" swap.exe';
  }

  if (sendAsset !== 'BTC') {
    return (
      <div>
        Only buying XMR is supported at the moment (you send BTC, you receive
        XMR)
      </div>
    );
  }

  if (error) {
    return <div>Error encountered while fetching price: {error.message}</div>;
  }

  if (!quote) {
    return <div>Loading latest price...</div>;
  }

  let youSend = BitcoinAmount.fromBtc(sendAmount);
  let youReceive = receiveAmountForSendAmount(youSend, quote.price);

  return (
    <div>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        p={1}
        m={1}
        className={classes.text}
      >
        You send
        <Box className={classes.amount}>{youSend.toBtcString() + ' BTC'}</Box>
        and receive approx.
        <Box className={classes.amount}>
          {youReceive.toXmrString() + ' XMR'}
        </Box>
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        p={1}
        m={1}
        className={classes.text}
      >
        Provider's maximum send quantity per swap:{' '}
        <Box className={classes.amount}>
          {quote.max_quantity.toBtcString()} BTC
        </Box>
      </Box>
      <Box display="flex" flexDirection="row" alignItems="center" p={1} m={1}>
        <Avatar className={classes.step_number}>1</Avatar>
        <a href={downloadUrl} download className={classes.step_text}>
          Download swap CLI
        </a>
      </Box>

      <Box component="span" display="block" p={1} m={1}>
        <Box display="flex" flexDirection="row" alignItems="center">
          <Avatar className={classes.step_number}>2</Avatar>
          <Box className={classes.step_text}>
            Enter Monero stagenet address to receive XMR:
          </Box>
        </Box>
        <Box component="span" display="block" mt={1}>
          <ValidatorForm onSubmit={() => {}}>
            <TextValidator
              id="moneroAddress"
              label="Your Monero stagenet wallet address"
              fullWidth={true}
              value={moneroAddress}
              onChange={event => {
                const val = event.target.value;

                // TODO: can access internal error state instead somehow?
                if (monero_address_regex.exec(val)) {
                  setValidMoneroAddress(val);
                } else {
                  setValidMoneroAddress(null);
                }

                setMoneroAddress(val);
              }}
              validators={['matchRegexp:' + monero_address_regex_str + '$']}
              errorMessages={['Invalid Monero Stagenet Address']}
            />
          </ValidatorForm>
        </Box>
      </Box>
      {validMoneroAddress ? (
        <Box>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            p={1}
            m={1}
          >
            <Avatar className={classes.step_number}>3</Avatar>
            <Box className={classes.step_text}>
              Copy command to execute swap in CLI (*):
            </Box>
          </Box>
          <Box
            display="flex"
            p={1}
            m={1}
            flexDirection="row"
            alignItems="center"
          >
            <Box
              id="command"
              overflow="scroll"
              whiteSpace="nowrap"
              className={classes.text}
            >
              {swapExecCommand} buy-xmr{' '}
              {network === Network.Mainnet ? '' : '--testnet'} --seller-addr=
              {getMultiaddrForNetwork(network).toString()} --seller-peer-id=
              {getPeerIdForNetwork(network).toString()} --receive-address{' '}
              {moneroAddress}
            </Box>
            <Box flexBasis={0}>
              <ClickAwayListener onClickAway={handleCopyTooltipClose}>
                <div>
                  <Tooltip
                    PopperProps={{
                      disablePortal: true,
                    }}
                    onClose={handleCopyTooltipClose}
                    open={copyTooltipOpen}
                    disableFocusListener
                    disableHoverListener
                    disableTouchListener
                    title="Command copied to clipboard"
                    placement="right"
                  >
                    <IconButton
                      color="primary"
                      onClick={() => {
                        let command = document.getElementById('command');
                        if (command) {
                          navigator.clipboard.writeText(command.innerText);
                          handleCopyTooltipOpen();
                        }
                      }}
                    >
                      <FileCopyIcon fontSize="large" />
                    </IconButton>
                  </Tooltip>
                </div>
              </ClickAwayListener>
            </Box>
          </Box>
          <Box display="block" p={1} m={1}>
            (*) Assumes that you run the command in the folder where you
            downloaded and unpacked the swap CLI binary!
          </Box>
        </Box>
      ) : (
        <Box display="flex" flexDirection="row" alignItems="center" p={1} m={1}>
          <Avatar className={classes.step_number_inactive}>3</Avatar>
          <Box className={classes.step_text_inactive}>
            Enter valid Monero Address to see Command
          </Box>
        </Box>
      )}
    </div>
  );
};

export default ComitSwapFlow;

const useStyles = makeStyles(theme =>
  createStyles({
    amount: {
      color: theme.palette.primary.main,
      marginRight: 5,
      marginLeft: 5,
    },
    text: {
      color: 'white',
      fontSize: 16,
    },
    step_text: {
      color: theme.palette.primary.main,
      fontSize: 18,
    },
    step_number: {
      borderColor: theme.palette.primary.main,
      borderWidth: 3,
      borderStyle: 'solid',
      color: theme.palette.getContrastText(theme.palette.primary.dark),
      backgroundColor: theme.palette.primary.dark,
      fontWeight: 1000,
      marginRight: 10,
    },
    step_text_inactive: {
      color: 'gray',
      fontSize: 18,
    },
    step_number_inactive: {
      borderColor: 'darkgray',
      borderWidth: 3,
      borderStyle: 'solid',
      color: 'white',
      backgroundColor: 'gray',
      fontWeight: 1000,
      marginRight: 10,
    },
  })
);
