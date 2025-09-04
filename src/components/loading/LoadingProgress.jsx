import React from 'react';
import { Progress } from 'antd';
import LoadingCoffee from './LoadingCoffee';

const LoadingProgress = ({ loadingProgress }) => {
  return (
    <div className='loading-niso-progress'>
      <LoadingCoffee />
      <Progress
        percent={loadingProgress}
        status="active"
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        style={{ marginTop: 10, maxWidth: '300px' }}
      />
      <span style={{marginTop: 10}}>Waiting for data...</span>
    </div>
  );
};

export default LoadingProgress; 