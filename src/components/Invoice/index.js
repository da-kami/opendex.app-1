import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Divider,
  TextareaAutosize,
  CircularProgress,
} from '@material-ui/core';
import svgIcons from '../../utils/svgIcons';
import Popover from '../../components/Popover';
import DrawQrCode from '../../components/DrawQrCode';
import useCopyToClipboard from '../../utils/copyToClipboard';
import { timeUntilExpiry } from '../../utils/invoiceDecoder';
import { getETALabelWithSeconds } from '../../services/refund/timestamp';

const Invoice = props => {
  const { invoice, lockupLink, isMobileView, statusMessage, currencySymbol } =
    props;

  const [etaTimeDiffLabel, setEtaTimeDiffLabel] = useState('');
  const [etaLeft, setETALeft] = useState(timeUntilExpiry(invoice));

  const [lockupAnchorEl, setLockupAnchorEl] = useState(null);
  const [invoiceAnchorEl, setInvoiceAnchorEl] = useState(null);

  const lockupOpen = Boolean(lockupAnchorEl);
  const invoiceOpen = Boolean(invoiceAnchorEl);

  const [isCopied, handleCopy] = useCopyToClipboard();

  const handleInvoicePopoverOpen = event => {
    setInvoiceAnchorEl(event.currentTarget);
  };

  const handleInvoicePopoverClose = () => {
    setInvoiceAnchorEl(null);
  };

  const handleLockupPopoverOpen = event => {
    setLockupAnchorEl(event.currentTarget);
  };

  const handleLockupPopoverClose = () => {
    setLockupAnchorEl(null);
  };

  useEffect(() => {
    if (window.webln) {
      (async () => {
        await window.webln.enable();
        await window.webln.sendPayment(invoice);
      })();
    }
  });

  useEffect(() => {
    setEtaTimeDiffLabel(getETALabelWithSeconds(etaLeft).label);

    if (etaLeft) {
      setTimeout(() => {
        setETALeft(etaLeft - 1);
      }, 1000);
    }
  }, [etaLeft]);

  const renderHeader = () => (
    <Typography
      variant="div"
      component="h3"
      align="center"
      className="submarine__send_header"
    >
      Pay this {currencySymbol} invoice
      {!!etaLeft && <p>Expires in {etaTimeDiffLabel}</p>}
      {!etaLeft && <p>Expired!</p>}
    </Typography>
  );

  const getLockupButton = () => (
    <Button color="primary">
      <a href={lockupLink} target="_blank" rel="noopener noreferrer">
        Check the lockup
      </a>
      <img
        src={svgIcons.questionIcon}
        alt="question-icon"
        className="question-icon"
        onMouseEnter={handleLockupPopoverOpen}
        onMouseLeave={handleLockupPopoverClose}
      />
    </Button>
  );

  const renderAddressFields = () => (
    <div className="submarine__send_invoice_group">
      <DrawQrCode size={180} link={invoice} />
      <div>
        <div className="address-header">
          <div>
            {currencySymbol} Invoice
            <img
              src={svgIcons.questionIcon}
              alt="question-icon"
              className="question-icon"
              onMouseEnter={handleInvoicePopoverOpen}
              onMouseLeave={handleInvoicePopoverClose}
            />
          </div>
          {!isMobileView && getLockupButton()}
        </div>
        {!isCopied && (
          <div className="textinfo-label">Copy the lightning invoice</div>
        )}
        {isCopied && <div className="textinfo-label">Copied!</div>}
        <TextareaAutosize
          className={'bitcoin-address'}
          rowsMin={5}
          rowsMax={5}
          cols={40}
          value={invoice}
          onClick={() => {
            handleCopy('.bitcoin-address');
          }}
          readOnly
        />
      </div>
    </div>
  );

  return (
    <div className="submarine__send">
      {renderHeader()}
      {renderAddressFields()}
      <div className="submarine__send_footer">
        <Divider />
        {isMobileView && getLockupButton()}
        <Button
          variant="contained"
          color="primary"
          loading={'true'}
          className={`next-step-button waiting`}
        >
          {statusMessage}
          <CircularProgress />
        </Button>
      </div>
      <Popover
        id="invoice-popover"
        open={invoiceOpen}
        anchorEl={invoiceAnchorEl}
        onCloseHandler={handleInvoicePopoverClose}
        text="A lightning invoice is how you receive payments on the lightning network. Use a lightning wallet to pay the invoice."
      />
      <Popover
        id="lockup-popover"
        open={lockupOpen}
        anchorEl={lockupAnchorEl}
        onCloseHandler={handleLockupPopoverClose}
        text="Check the address to which Boltz will lockup coins after the invoice is paid."
      />
    </div>
  );
};

Invoice.propTypes = {
  invoice: PropTypes.string.isRequired,
  lockupLink: PropTypes.string.isRequired,
  isMobileView: PropTypes.bool.isRequired,
  statusMessage: PropTypes.string.isRequired,
  currencySymbol: PropTypes.string.isRequired,
};

export default Invoice;
