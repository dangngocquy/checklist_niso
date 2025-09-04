import { useState, useEffect } from 'react';
import { MobileOutlined, TabletOutlined, DesktopOutlined, QuestionOutlined } from '@ant-design/icons';
import { FaApple, FaAndroid, FaWindows, FaLinux } from 'react-icons/fa';
import UAParser from 'ua-parser-js';
import { useTranslation } from 'react-i18next';

const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState({});
  const [browser, setBrowser] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    let deviceType = 'Unknown';
    let deviceIcon = <QuestionOutlined />;
    if (result.device.type) {
      switch (result.device.type) {
        case 'mobile':
          deviceType = t('Department.input154');
          deviceIcon = <MobileOutlined />;
          break;
        case 'tablet':
          deviceType = t('Department.input155');
          deviceIcon = <TabletOutlined />;
          break;
        case 'desktop':
          deviceType = t('Department.input156');
          deviceIcon = <DesktopOutlined />;
          break;
        default:
          deviceType = t('Department.input157');
          deviceIcon = <QuestionOutlined />;
      }
    } else if (!/mobile|tablet|ipad/i.test(navigator.userAgent)) {
      deviceType = t('Department.input156');
      deviceIcon = <DesktopOutlined />;
    }

    let brand = result.device.vendor || '';
    let model = result.device.model || '';
    let osIcon = <QuestionOutlined />;

    if (!brand) {
      if (result.os.name) {
        if (result.os.name.toLowerCase().includes('android')) {
          brand = 'Thiết bị Android';
          osIcon = <FaAndroid />;
        } else if (result.os.name.toLowerCase().includes('ios')) {
          brand = 'Apple';
          osIcon = <FaApple />;
        } else if (result.os.name.toLowerCase().includes('windows')) {
          brand = 'Windows PC';
          osIcon = <FaWindows />;
        } else if (result.os.name.toLowerCase().includes('mac')) {
          brand = 'Apple Mac';
          osIcon = <FaApple />;
        } else if (result.os.name.toLowerCase().includes('linux')) {
          brand = 'Linux';
          osIcon = <FaLinux />;
        } else {
          brand = result.os.name;
        }
      }
    }

    setDeviceInfo({
      type: deviceType,
      icon: deviceIcon,
      brand: brand || 'Unknown',
      model: model || 'Unknown',
      os: result.os.name || 'Unknown',
      osIcon: osIcon
    });

    setBrowser(result.browser.name || 'Unknown');
  }, [t]);

  return { deviceInfo, browser };
};

export default useDeviceInfo; 