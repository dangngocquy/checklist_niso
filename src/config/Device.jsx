import { useEffect, useState } from 'react';

const Device = () => {
  const [browserInfo, setBrowserInfo] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const browserRegex = /(Chrome|Safari|Firefox|MSIE|Trident(?=\/)|Opera|OPR|Edge|Edg|Brave|Vivaldi|SamsungBrowser|UCBrowser|Konqueror|Chromium|Seamonkey|Silk|Yabrowser|BlackBerryBrowser|WebosBrowser|SymbianBrowser|Firefox Focus|Puffin|MIUIBrowser|Focus|DuckDuckGo|Maxthon|PaleMoon|Sleipnir|Microsoft-Edge|Netscape|Avant Browser|BingBot|Baidubrowser)\/?\s*(\d+)/i;
    const browserMatch = userAgent.match(browserRegex);
    const deviceRegex = /(iPhone|iPod|iPad|Android|Windows|Macintosh|Linux|BlackBerry|WebOS|Symbian|Windows Phone|Tablet|Mobile|TV|Smartwatch|Gaming Console)/i;
    const deviceMatch = userAgent.match(deviceRegex);

    if (browserMatch) {
      const browserName = browserMatch[1].toLowerCase();
      setBrowserInfo(browserName);
    }

    if (deviceMatch) {
      const deviceName = deviceMatch[1].toLowerCase();
      setDeviceInfo(deviceName);
    } else {
      setDeviceInfo("unknown");
    }
  }, []);

  return { browserInfo, deviceInfo };
};

export default Device;
