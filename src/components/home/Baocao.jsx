import React, { useState, useEffect, useRef } from 'react';
import { Empty } from 'antd';
import useApi from '../../hook/useApi';
import PropTypes from 'prop-types';
import LoadingProgress from '../loading/LoadingProgress';

const Baocao = ({ user }) => {
  const { fetchReports } = useApi();
  const [latestReport, setLatestReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingProgress(0); // Reset progress to 0 when starting

      console.log('Fetching reports with user:', user);

      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval); // Stop at 90% until fetch completes
            return prev;
          }
          return prev + 10; // Increment progress
        });
      }, 200); // Adjust speed of progress here (e.g., every 200ms)

      // Fetch all reports
      const reportResponse = await fetchReports(1, 1000, "all");
      console.log('API Response:', reportResponse);

      const reports = reportResponse.data || [];
      console.log('All Reports:', reports);

      if (reports.length > 0) {
        // Filter reports where user data matches
        const matchingReports = reports.filter(report => {
          const userKeysArray = Array.isArray(report.userKeys) ? report.userKeys : [];
          const boPhanRpArray = Array.isArray(report.bo_phan_rp) ? report.bo_phan_rp : [];
          const shopArray = Array.isArray(report.shop) ? report.shop : [];

          const matchesKeys = userKeysArray.some(key => 
            key && user.keys && key.toString().toLowerCase() === user.keys.toString().toLowerCase()
          );
          const matchesBophan = boPhanRpArray.some(bophan => 
            bophan && user.bophan && bophan.toString().toLowerCase() === user.bophan.toString().toLowerCase()
          );
          const matchesChinhanh = shopArray.some(shop => 
            shop && user.chinhanh && shop.toString().toLowerCase() === user.chinhanh.toString().toLowerCase()
          );

          return matchesKeys || matchesBophan || matchesChinhanh;
        });

        console.log('Matching Reports:', matchingReports);

        if (matchingReports.length > 0) {
          // Sort by createdAt in descending order
          const sortedReports = matchingReports.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          });

          console.log('Sorted Matching Reports:', sortedReports);
          setLatestReport(sortedReports[0]);
        } else {
          console.log('No matching reports found');
          setLatestReport(null);
        }
      } else {
        console.log('No reports returned');
        setLatestReport(null);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLatestReport(null);
    } finally {
      setLoadingProgress(100); // Set progress to 100% when done
      setLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      fetchData();
      hasFetched.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingProgress loadingProgress={loadingProgress} />;
  }

  if (!latestReport) {
    return <Empty description="Không có báo cáo nào phù hợp." />;
  }

  return (
    <iframe
      title={`Report: ${latestReport.title}`}
      src={latestReport.link}
      style={{ width: '100%', height: '600px', border: 'none' }}
      className='ifmbn'
    />
  );
};

Baocao.propTypes = {
  user: PropTypes.shape({
    bophan: PropTypes.string,
    keys: PropTypes.string,
    chinhanh: PropTypes.string,
  }).isRequired,
};

export default Baocao;