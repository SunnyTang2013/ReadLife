import React, { useState, useEffect } from 'react';
import appInfoService from '../backend/appInfoService';

function Footer() {
  const [appInfo, setAppInfo] = useState({});

  useEffect(() => {
    loadAppInfo();
  }, []);

  const loadAppInfo = async () => {
    try {
      const appInfoData = await appInfoService.getAppInfo();
      setAppInfo(appInfoData);
    } catch (error) {
      console.log(`Fail to load app info: ${error}`);
    }
  };

  const date = new Date();
  const year = date.getFullYear();
  
  return (
    <footer id="footer" className="fixed-bottom">
      <div className="container-fluid">
        <div className="row">
          <div className="col-4">
            Scorch {appInfo.versionString || ''}
          </div>
          <div className="col-4 text-center">
            Copyright &copy; HSBC {year}
          </div>
          <div className="col-4 text-right">
            <div className="col-sm">
              <i className="fa fa-fw fa-database mr-1" />
              {appInfo.databaseName || '?'} | {appInfo.refreshPolicy || '?'}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;