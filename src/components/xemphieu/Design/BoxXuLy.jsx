import React from 'react';
import Container from "../../../config/PhieuChecklist/Container";
import Avatars from "../../../config/design/Avatars";
import {
    Avatar,
    Space,
    Alert,
    Tooltip,
    Row,
    Col,
    Badge,
} from "antd";
import UserInfoCard from "../../../hook/UserInfoCard";
import {
    ShopOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';

const BoxXuLy = ({ renderThoiGianXuLy, isTaskCompleted, data }) => {
    const statBlockStyle = {
        padding: '16px',
        textAlign: 'center',
        borderRadius: '8px',
        background: 'rgb(244, 235, 216, 0.6)',
        transition: 'transform 0.2s',
        height: '100%',
    };

    const titleStyle = {
        fontSize: window.innerWidth < 768 ? '11px' : '13px',
        marginBottom: '8px',
        color: 'var(--extra-background)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: '600',
    };

    const valueStyle = {
        fontSize: window.innerWidth < 768 ? '11px' : '14px',
        color: '#333',
    };

    const statusStyle = {
        width: '100%',
        borderRadius: '6px',
        marginTop: '8px',
    };

    return (
        <Container
            content={
                <>
                    {/* Stats section */}
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={8} md={8} lg={6}>
                            <div style={statBlockStyle} className="stat-block">
                                <Tooltip
                                    title={<UserInfoCard user={data.user} />}
                                    placement={window.innerWidth < 768 ? 'top' : 'right'}
                                    color="white"
                                    overlayStyle={{ maxWidth: 300 }}
                                >
                                    <Space direction="vertical" size="small" align="center" style={{ marginBottom: 8 }}>
                                        {data?.user?.imgAvatar ? (
                                            <Badge dot status="success" offset={[-4, 36]}>
                                                <Avatar
                                                    src={data.user.imgAvatar}
                                                    size='middle'
                                                    onError={() => {
                                                        console.log("Error loading avatar:", data.user.imgAvatar);
                                                        return false;
                                                    }}
                                                    style={{ border: '2px solid #f0f0f0' }}
                                                />
                                            </Badge>
                                        ) : (
                                            <Avatars user={{ name: data?.user?.name ?? "N/A" }} sizeImg='middle' />
                                        )}
                                    </Space>
                                </Tooltip>
                                <div style={titleStyle}>
                                    Yêu cầu bởi
                                </div>
                                <div style={valueStyle}>
                                    {data?.user?.name ?? "N/A"}
                                </div>
                            </div>
                        </Col>

                        <Col xs={12} sm={8} md={8} lg={6}>
                            <div style={statBlockStyle} className="stat-block">
                                <ShopOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '8px' }} />
                                <div style={titleStyle}>Shop</div>
                                <div style={valueStyle}>{data?.chi_nhanh ?? "N/A"}</div>
                            </div>
                        </Col>


                        <Col xs={12} sm={8} md={8} lg={6}>
                            <div style={statBlockStyle} className="stat-block">
                                <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                                <div style={titleStyle}>Xử lý trước</div>
                                <div style={valueStyle}>{renderThoiGianXuLy()}</div>
                            </div>
                        </Col>

                        <Col xs={12} sm={8} md={8} lg={6}>
                            <div style={statBlockStyle} className="stat-block">
                                <CheckCircleOutlined style={{ fontSize: '24px', color: isTaskCompleted ? '#52c41a' : '#1890ff', marginBottom: '8px' }} />
                                <div style={titleStyle}>Trạng thái</div>
                                <Alert
                                    message={isTaskCompleted ? "Đã duyệt" : "Chờ duyệt"}
                                    type={isTaskCompleted ? "success" : "info"}
                                    showIcon
                                    banner
                                    style={statusStyle}
                                />
                            </div>
                        </Col>
                    </Row>
                </>
            }
        />
    );
};

export default BoxXuLy;