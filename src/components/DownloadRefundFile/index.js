import React from 'react';
import PropTypes from 'prop-types';
import detectTorBrowser from '../../utils/detectTorBrowser';
import createRefundQr from '../../utils/createRefundQr';

class DownloadRefundFile extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {
    this.ref.current.click();
  }

  render() {
    const { id, currency, privateKey, redeemScript, timeoutBlockHeight } =
      this.props;

    const isTorBrowser = detectTorBrowser();

    let refundFile = JSON.stringify({
      id,
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

    return (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a
        target="_blank"
        rel="noopener noreferrer"
        ref={this.ref}
        href={refundFile}
        download={isTorBrowser ? 'refund.json' : 'refund.png'}
      />
    );
  }
}

DownloadRefundFile.propTypes = {
  currency: PropTypes.string.isRequired,
  redeemScript: PropTypes.string.isRequired,
  privateKey: PropTypes.string.isRequired,
  timeoutBlockHeight: PropTypes.number.isRequired,
};

export default DownloadRefundFile;
