import React, { useEffect, useState } from 'react';
import { Spin, Button } from 'antd';

const QRCodeLogin = ({ isQRCameraOpen, handleLogin, user }) => {
    const [loading, setLoading] = useState(false);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (!isQRCameraOpen) {
            setScanned(false);
            setLoading(false);
        }
    }, [isQRCameraOpen]);

    return (
        <div>
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 15, marginBottom: 15 }}>
                    <Spin size="small" />
                </div>
            )}
            Chức năng đang được phát triển
            {scanned && (
                <div style={{ marginTop: 15 }}>
                    <center style={{ marginBottom: 15 }}>Xác nhận đăng nhập</center>
                    <Button
                        onClick={() => handleLogin(user)}
                        style={{ width: '100%' }}
                        type='primary'
                    >
                        Đăng nhập
                    </Button>
                </div>
            )}
        </div>
    );
};

export default QRCodeLogin;