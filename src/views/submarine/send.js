import { useSelector } from 'react-redux';
import { ContractABIs } from 'boltz-core';
import { Contract, constants } from 'ethers';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect, useContext } from 'react';
import {
  Typography,
  Button,
  Divider,
  TextareaAutosize,
  CircularProgress,
} from '@material-ui/core';
import svgIcons from '../../utils/svgIcons';
import Popover from '../../components/Popover';
import TextInfo from '../../components/TextInfo';
import DrawQrCode from '../../components/DrawQrCode';
import SelectComponent from '../../components/Select';
import { GET_FEE_ESTIMATION } from '../../api/apiUrls';
import { UtilsContext } from '../../context/UtilsContext';
import { decodeInvoice } from '../../utils/invoiceDecoder';
import useCopyToClipboard from '../../utils/copyToClipboard';
import { formatTokenAmount } from '../../utils/ethereumDecimals';
import { selectSigner } from '../../services/ethereum/ethereumSelectors';
import { getBlockExplorerTransactionLink } from '../../utils/blockExplorerLink';
import {
  CurrencyTypes,
  fundTransferTypes,
  satConversionValue,
  isEthereumCurrencyType,
} from '../../constants/submarine';
import {
  selectInvoice,
  selectContracts,
  selectSwapStatus,
  selectSwapDetails,
  selectSendCurrency,
  selectChannelCreation,
} from '../../services/submarine/submarineSelectors';

const useStyles = makeStyles({
  ethereumButtons: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-around',
  },
  feeEstimationWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeEstimationLabel: {
    width: '100px',
    background: '#F9F2CD',
    borderRadius: '6px',
    color: '#6F6635',
    fontSize: '15px',
    fontWeight: 'normal',
    textAlign: 'center',
  },
  customDivider: {
    margin: '10px 0 !important',
  },
});

const Send = props => {
  const utilsContext = useContext(UtilsContext);
  const isMobileView = !!utilsContext?.isMobileView;

  const { handleNextStep } = props;
  const classes = useStyles();

  const signer = useSelector(selectSigner);
  const swapInvoice = useSelector(selectInvoice);
  const swapStatus = useSelector(selectSwapStatus);
  const swapDetails = useSelector(selectSwapDetails);
  const sendCurrency = useSelector(selectSendCurrency);
  const contractAddresses = useSelector(selectContracts);
  const channelCreation = useSelector(selectChannelCreation);

  const amount = swapDetails.expectedAmount;
  const qrCode = swapDetails.bip21;

  const fundTransferType = fundTransferTypes[sendCurrency.symbol];
  const [currencyOption, setCurrencyOption] = useState(
    // Prefer the second entry (which is whole coins for currencies that have more than one denomination)
    fundTransferType[1] || fundTransferType[0]
  );

  const isChannelCreation = channelCreation !== undefined;
  const isEthereum = isEthereumCurrencyType(sendCurrency.type);

  const [isCopied, handleCopy] = useCopyToClipboard();
  const [showApproveButton, setShowApproveButton] = React.useState(false);
  const [fundsApproved, setFundsApproved] = React.useState(null);
  const [fundsSent, setFundsSent] = React.useState(null);
  const [feeEstimations, setFeeEstimations] = React.useState(null);
  const [feeEstimationAnchorEl, setFeeEstimationAnchorEl] =
    React.useState(null);

  let swapContract;
  let tokenContract;

  if (signer !== undefined) {
    swapContract =
      sendCurrency.type === CurrencyTypes.Ether
        ? new Contract(
            contractAddresses.ethereum.swapContracts.EtherSwap,
            ContractABIs.EtherSwap,
            signer
          )
        : new Contract(
            contractAddresses.ethereum.swapContracts.ERC20Swap,
            ContractABIs.ERC20Swap,
            signer
          );

    tokenContract =
      sendCurrency.type === CurrencyTypes.ERC20
        ? new Contract(
            contractAddresses.ethereum.tokens[sendCurrency.symbol],
            ContractABIs.ERC20,
            signer
          )
        : undefined;
  }

  const feeEstimationPopoverOpen = Boolean(feeEstimationAnchorEl);

  useEffect(() => {
    // The approval logic is not needed for UTXO based chains and Ether
    if (tokenContract === undefined) {
      setFundsApproved(true);
      return;
    }

    const checkApproval = async () => {
      const [allowance, decimals] = await Promise.all([
        tokenContract.allowance(
          await signer.getAddress(),
          swapContract.address
        ),
        tokenContract.decimals(),
      ]);

      if (
        allowance.lt(formatTokenAmount(swapDetails.expectedAmount, decimals))
      ) {
        setShowApproveButton(true);
      } else {
        setFundsApproved(true);
      }
    };

    checkApproval();
  }, [signer, tokenContract, contractAddresses, swapDetails, swapContract]);

  useEffect(() => {
    const getFeeEstimation = async () => {
      const data = await fetch(GET_FEE_ESTIMATION);
      const feeEstimationsResult = await data.json();
      setFeeEstimations(feeEstimationsResult);
    };

    if (sendCurrency.type === CurrencyTypes.BitcoinLike) {
      getFeeEstimation();
    }
  }, [setFeeEstimations, sendCurrency]);

  const nextStepHandler = () => {
    if (swapStatus.pending) {
      return;
    }
    handleNextStep();
  };

  const handleFeeEstimationPopoverOpen = event => {
    setFeeEstimationAnchorEl(event.currentTarget);
  };

  const handleFeeEstimationPopoverClose = () => {
    setFeeEstimationAnchorEl(null);
  };

  const approveFunds = () => {
    setFundsApproved(false);

    tokenContract
      .approve(swapContract.address, constants.MaxUint256)
      .then(reciept => {
        reciept.wait(1).then(() => {
          setFundsApproved(true);
        });
      });
  };

  const sendFunds = async () => {
    setFundsSent(false);

    const preimageHash = Buffer.from(
      decodeInvoice(swapInvoice).paymentHash,
      'hex'
    );

    if (sendCurrency.type === CurrencyTypes.Ether) {
      swapContract.lock(
        preimageHash,
        swapDetails.claimAddress,
        swapDetails.timeoutBlockHeight,
        {
          value: formatTokenAmount(swapDetails.expectedAmount, 18),
        }
      );
    } else if (sendCurrency.type === CurrencyTypes.ERC20) {
      const tokenDecimals = await tokenContract.decimals();

      swapContract.lock(
        preimageHash,
        formatTokenAmount(swapDetails.expectedAmount, tokenDecimals),
        tokenContract.address,
        swapDetails.claimAddress,
        swapDetails.timeoutBlockHeight
      );
    }
  };

  const getAmountValue = () => {
    if (currencyOption.value === '1') return amount;
    return amount / satConversionValue;
  };

  const renderHeader = () => (
    <Typography
      variant="div"
      component="h3"
      align="center"
      className="submarine__send_header"
    >
      Send
      <div className="funds-group">
        {getAmountValue()}
        <SelectComponent
          options={fundTransferTypes[sendCurrency.symbol]}
          variant="outlined"
          value={currencyOption}
          className={'funds-type-dropdown'}
          onChange={val => setCurrencyOption(val)}
        />
      </div>
      {
        // Not Bitcoin is either Ether or an ERC20 token (sends for Submarine Swaps are always onchain)
      }
      {sendCurrency.type !== CurrencyTypes.BitcoinLike
        ? 'to initiate the swap'
        : 'to this address'}
      {feeEstimations && (
        <div className={classes.feeEstimationWrapper}>
          <span className={classes.feeEstimationLabel}>
            {feeEstimations[sendCurrency.symbol]} sat/vbyte
          </span>
          <TextInfo
            explanation={true}
            onMouseEnterHandler={handleFeeEstimationPopoverOpen}
            onMouseLeaveHandler={handleFeeEstimationPopoverClose}
          />
        </div>
      )}
    </Typography>
  );

  const renderAddressFields = () => (
    <div className="submarine__send_invoice_group" style={{ marginTop: 0 }}>
      <DrawQrCode size={200} link={qrCode} />
      <div>
        {!isCopied && (
          <div className="textinfo-label">
            Copy the {sendCurrency.label} address
          </div>
        )}
        {isCopied && <div className="textinfo-label">Copied!</div>}
        <TextareaAutosize
          className={'bitcoin-address'}
          rowsMin={5}
          rowsMax={5}
          cols={40}
          value={swapDetails.address}
          readOnly
          onClick={() => {
            handleCopy('.bitcoin-address');
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="submarine__send">
      {renderHeader()}
      {!isEthereum && renderAddressFields()}
      <div
        className={`submarine__send_footer ${
          isEthereum ? 'submarine__send_ethereum_footer' : ''
        }`}
      >
        <Divider
          className={
            sendCurrency.type === CurrencyTypes.BitcoinLike && !isMobileView
              ? classes.customDivider
              : ''
          }
        />
        {isChannelCreation && (
          <a
            className="explorer-link"
            href={getBlockExplorerTransactionLink(
              sendCurrency.symbol,
              channelCreation.fundingTransactionId
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={svgIcons.externalLinkIcon} alt="external-link" />
            Channel funding transaction
          </a>
        )}
        {isEthereum && !fundsSent && (
          <div className={showApproveButton ? classes.ethereumButtons : ''}>
            {showApproveButton && (
              <Button
                disabled={fundsApproved}
                variant="contained"
                color="primary"
                onClick={approveFunds}
                className={`${
                  swapStatus.error ? 'failure-button' : 'next-step-button'
                } waiting button-with-spinner`}
                loading={fundsApproved === false}
              >
                Approve funds
                {fundsApproved === false && <CircularProgress />}
              </Button>
            )}
            <Button
              disabled={!fundsApproved}
              variant="contained"
              color="primary"
              onClick={sendFunds}
              className={`${
                swapStatus.error ? 'failure-button' : 'next-step-button'
              } waiting button-with-spinner`}
            >
              {fundsSent === false
                ? 'Waiting for one confirmation'
                : 'Send funds'}
              {fundsSent === false && <CircularProgress />}
            </Button>
          </div>
        )}
        {!isEthereum && (
          <Button
            variant="contained"
            color="primary"
            onClick={nextStepHandler}
            className={`${
              swapStatus.error ? 'failure-button' : 'next-step-button'
            } waiting`}
            loading={swapStatus.pending}
          >
            {swapStatus.message}
            {!!swapStatus.pending && <CircularProgress />}
          </Button>
        )}
      </div>
      <Popover
        id="fee-estimation-popover"
        open={feeEstimationPopoverOpen}
        anchorEl={feeEstimationAnchorEl}
        onCloseHandler={handleFeeEstimationPopoverClose}
        text="Minimum recommended fee to get your transaction confirmed quickly."
      />
    </div>
  );
};

export default Send;
