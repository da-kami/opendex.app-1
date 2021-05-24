import React, { useEffect, useMemo } from 'react';
import { RefundDetails } from '../../constants/boltzSwap';
import createRefundQr from '../../utils/createRefundQr';
import detectTorBrowser from '../../utils/detectTorBrowser';

type DownloadRefundFileProps = {
  details: RefundDetails;
};

const DownloadRefundFile = (props: DownloadRefundFileProps) => {
  const ref: React.RefObject<HTMLAnchorElement> = useMemo(
    () => React.createRef(),
    []
  );

  const {
    swapId,
    currency,
    privateKey,
    redeemScript,
    timeoutBlockHeight,
  } = props.details;

  useEffect(() => {
    ref?.current?.click();
  }, [ref]);

  const isTorBrowser = detectTorBrowser();

  let refundFile = JSON.stringify({
    swapId,
    currency,
    privateKey,
    redeemScript,
    timeoutBlockHeight,
  });

  // The Tor browser can't create PNG QR codes so we need to download the information as JSON
  if (isTorBrowser) {
    refundFile = 'data:application/json;charset=utf-8,' + refundFile;
  } else {
    refundFile = createRefundQr(refundFile);
  }

  const fileName = `refund-${swapId}`;

  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      target="_blank"
      rel="noopener noreferrer"
      ref={ref}
      href={refundFile}
      download={isTorBrowser ? `${fileName}.json` : `${fileName}.png`}
    />
  );
};

export default DownloadRefundFile;
