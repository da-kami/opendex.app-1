import { useEffect, useState } from 'react';
import axios from 'axios';
import { getOs } from './utils';

const GITHUB_RELEASE_URL =
  'https://api.github.com/repos/comit-network/xmr-btc-swap/releases/latest';

export default function useDownloadUrl() {
  const downloadUrlPlaceholder =
    'https://github.com/comit-network/xmr-btc-swap/releases/latest';
  const [downloadUrl, setDownloadUrl] = useState<string>(
    downloadUrlPlaceholder
  );

  useEffect(() => {
    axios.get(GITHUB_RELEASE_URL).then(res => {
      let gh = res.data;
      const os = getOs();
      for (let asset of gh.assets) {
        if (asset.name.startsWith('swap') && asset.name.includes(os)) {
          setDownloadUrl(asset.browser_download_url);
        }
      }
    });
  }, [setDownloadUrl]);

  return downloadUrl;
}
