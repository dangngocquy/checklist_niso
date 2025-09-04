import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

function NutLichSu() {
    const navigate = useNavigate();
    return (
        <Button
            type="link"
            onClick={() => navigate('/auth/docs/lich-su-cham-cong')}
        >
            Lịch sử chấm công
        </Button>
    )
}

export default NutLichSu;