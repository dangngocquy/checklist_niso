import React from "react";
import { useNavigate } from "react-router-dom";
import { Result, Button } from "antd";

const NotFoundPage = React.memo(() => {
    const navigate = useNavigate();
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: 20, textAlign: 'center' }}>
            <title>NISO CHECKLIST | 404 Notfound</title>
            <Result
                title="Oops !"
                icon={<div className="notfound" style={{height: '35vh'}}></div>}
                subTitle="Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập."
                extra={
                    <Button type="primary" onClick={() => navigate('/')}>
                        Quay lại trang chủ
                    </Button>
                }
            />
        </div>
    )
});

export default NotFoundPage;