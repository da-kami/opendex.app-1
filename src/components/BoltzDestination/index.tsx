import { FormControlLabel, Grid, Switch, TextField } from '@material-ui/core';
import React, { ReactElement, useEffect, useState } from 'react';
import { BOLTZ_CREATE_SWAP_API_URL } from '../../api/boltzApiUrls';
import { boltzPairsMap } from '../../constants/boltzRates';
import { BoltzSwapResponse, RefundDetails } from '../../constants/boltzSwap';
import { useBoltzConfiguration } from '../../context/NetworkContext';
import { isInvoiceValid } from '../../services/submarine/invoiceValidation';
import { generateKeys } from '../../services/submarine/keys';
import { useAppSelector } from '../../store/hooks';
import {
  selectReceiveAmount,
  selectReceiveAsset,
  selectSendAsset,
} from '../../store/swaps-slice';
import { addRefundDetailsToLocalStorage } from '../../utils/boltzRefund';
import BoltzSwapStep from '../BoltzSwapStep';
import DownloadRefundFile from '../DownloadRefundFile';

type BoltzDestinationProps = {
  proceedToNext: (swapDetails: BoltzSwapResponse) => void;
};

const BoltzDestination = (props: BoltzDestinationProps): ReactElement => {
  const { proceedToNext } = props;
  const receiveAmount = useAppSelector(selectReceiveAmount);
  const receiveCurrency = useAppSelector(selectReceiveAsset);
  const sendCurrency = useAppSelector(selectSendAsset);
  const [invoice, setInvoice] = useState('');
  const [error, setError] = useState('');
  const [downloadRefundFile, setDownloadRefundFile] = useState(true);
  const { apiEndpoint, bitcoinConstants } = useBoltzConfiguration();
  const [keys, setKeys] = useState<{ publicKey?: string; privateKey?: string }>(
    {}
  );
  const [refundDetails, setRefundDetails] = useState<RefundDetails | undefined>(
    undefined
  );

  const invoiceText = `${receiveAmount} ${receiveCurrency}`;
  const invoiceFieldText = `Invoice for ${invoiceText}`;

  const invoiceValid = invoice => !invoice || isInvoiceValid(invoice);

  const nextEnabled = !!invoice && isInvoiceValid(invoice);

  useEffect(() => {
    setKeys(generateKeys(bitcoinConstants));
  }, [sendCurrency, receiveCurrency, bitcoinConstants]);

  const createSwap = () => {
    const params = {
      type: 'submarine',
      pairId: `${boltzPairsMap(sendCurrency)}/${boltzPairsMap(
        receiveCurrency
      )}`,
      orderSide: 'sell',
      invoice: invoice,
      refundPublicKey: keys.publicKey,
      channel: {
        auto: true,
        private: false,
        inboundLiquidity: 25,
      },
    };

    fetch(BOLTZ_CREATE_SWAP_API_URL(apiEndpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(params),
    }).then(async response => {
      const data: BoltzSwapResponse = await response.json();

      if (response.status === 201) {
        setError('');
        const refundData: RefundDetails = {
          swapId: data.id,
          currency: sendCurrency,
          timeoutBlockHeight: data.timeoutBlockHeight,
          redeemScript: data.redeemScript!,
          privateKey: keys.privateKey!,
          date: new Date(),
        };
        setRefundDetails(refundData);
        addRefundDetailsToLocalStorage(refundData);
        proceedToNext(data);
        return;
      }
      const message = data.error || 'Something went wrong. Please try again.';
      setError(message);
    });
  };

  return (
    <BoltzSwapStep
      title={
        <>
          Paste invoice to receive
          <br />
          {invoiceText}
        </>
      }
      content={
        <Grid item container justify="center">
          <TextField
            multiline
            fullWidth
            variant="outlined"
            aria-label={invoiceFieldText}
            rows={5}
            placeholder={invoiceFieldText}
            value={invoice}
            onChange={e => {
              setInvoice(e.target.value);
              setError('');
            }}
            error={!invoiceValid(invoice)}
            helperText={!invoiceValid(invoice) && 'Invalid invoice'}
          />
          <FormControlLabel
            control={
              <Switch
                checked={downloadRefundFile}
                onChange={() => setDownloadRefundFile(oldValue => !oldValue)}
                name="downloadRefundFile"
                color="primary"
              />
            }
            label="Download refund file"
          />
          {downloadRefundFile && !!refundDetails && (
            <DownloadRefundFile details={refundDetails} />
          )}
        </Grid>
      }
      errorMessage={error}
      mainButtonText="Next"
      mainButtonVisible
      onMainButtonClick={createSwap}
      mainButtonDisabled={!nextEnabled}
    />
  );
};

export default BoltzDestination;
