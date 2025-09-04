import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams } from 'react-router-dom';
import { FloatButton, Empty } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import useApi from '../../../../hook/useApi';
import NotFoundPage from '../../../NotFoundPage';
import LoadingProgress from '../../LoadingProgress';

const ReportViewer = React.memo(({ t, user }) => {
    const { keys } = useParams();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const iframeRef = useRef(null);
    const { reportApi } = useApi();
    const [loadingProgress, setLoadingProgress] = useState(0);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!hasFetched.current && keys) {
            const fetchReport = async () => {
                try {
                    setLoading(true);
                    setLoadingProgress(0);

                    const progressInterval = setInterval(() => {
                        setLoadingProgress((prev) => {
                            if (prev >= 90) {
                                clearInterval(progressInterval);
                                return prev;
                            }
                            return prev + 10;
                        });
                    }, 200);

                    const response = await reportApi.fetchById(keys);
                    setReportData(response.data);
                } catch (error) {
                    console.error(error.message);
                    setReportData(null);
                } finally {
                    setLoadingProgress(100);
                    setLoading(false);
                }
            };

            fetchReport();
            hasFetched.current = true;
        }
    }, [keys, reportApi]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (iframeRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                iframeRef.current.requestFullscreen();
            }
        }
    };

    if (loading) {
        return <LoadingProgress loadingProgress={loadingProgress} />;
    }

    // Cập nhật logic điều kiện: Nếu user.phanquyen === true thì không trả về NotFoundPage
    if (
        !reportData ||
        (user?.phanquyen !== true && // Chỉ kiểm tra các điều kiện khác nếu phanquyen không phải true
         !reportData.bo_phan_rp?.includes(user?.bophan) &&
         !reportData.userKeys?.includes(user?.keys) &&
         !reportData.shop?.includes(user?.bophan))
    ) {
        return <NotFoundPage />;
    }

    return (
        <>
            <title>NISO | {t('ListEdits.input35')} {reportData?.bo_phan_rp}</title>
            <div className="mobile-pc-report">
                {reportData ? (
                    <iframe
                        src={reportData.link}
                        title={reportData.bo_phan_rp}
                        className="ReportViewer"
                        ref={iframeRef}
                    />
                ) : (
                    <Empty>No report data available</Empty>
                )}
            </div>
            {ReactDOM.createPortal(
                <FloatButton
                    tooltip={isFullscreen ? t('Department.input282') : t('Department.input283')}
                    type="primary"
                    onClick={toggleFullscreen}
                    icon={isFullscreen ? <ZoomOutOutlined /> : <ZoomInOutlined />}
                    className="hine__floadt_screen__niso"
                />,
                document.body
            )}
        </>
    );
});

export default ReportViewer;