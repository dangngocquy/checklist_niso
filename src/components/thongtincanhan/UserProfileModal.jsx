import React, { useMemo } from 'react';
import {
    Drawer,
    Space,
    Typography,
    Avatar,
    Divider,
    Tag,
    Button,
    Row,
    Col,
    Card,
    Tooltip
} from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    CalendarOutlined,
    BankOutlined,
    DesktopOutlined,
    InfoCircleOutlined,
    MailOutlined,
    PhoneOutlined
} from '@ant-design/icons';
import Avatars from '../../config/design/Avatars';
import backgroundProfile from '../../assets/shop.png'; // Default background image

const { Title, Text, Paragraph } = Typography;

// Tách thành component riêng để tránh render lại không cần thiết
const DetailItem = React.memo(({ icon, label, value }) => (
    <Card
        bordered={false}
        className="detail-card-item"
        style={{
            marginBottom: '12px',
            borderRadius: '8px',
            background: '#f9f9f9',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}
    >
        <Space align="start">
            <div className="icon-container">
                {icon}
            </div>
            <div>
                <Text type="secondary" style={{ fontSize: '13px' }}>{label}</Text>
                <Paragraph strong style={{ margin: 0, fontSize: '15px' }}>{value || 'Chưa cập nhật'}</Paragraph>
            </div>
        </Space>
    </Card>
));

// Tách các phần UI thành component riêng
const ProfileHeader = React.memo(({ backgroundImg }) => (
    <div
        className="profile-background"
        style={{
            backgroundImage: `url(${backgroundImg})`,
            height: '200px',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end'
        }}
    >
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7))',
            }}
        />

        <div
            style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 10
            }}
        >
            <Space>
                <UserOutlined style={{ color: 'white' }} />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                    Thông tin người dùng
                </Text>
            </Space>
        </div>
    </div>
));

const UserAvatar = React.memo(({ userData, Frame, user }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}
    >
        {userData.imgAvatar && userData.imgAvatar !== "null" ? (
           <div style={{position: 'relative'}}>
             <div className="avatar avatar-x-large">
            <Avatar
                size={120}
                src={userData.imgAvatar}
                style={{
                    border: '5px solid white',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    background: '#fff'
                }}
            />
            {userData.name === 'Đặng Ngọc Quý' && <img src={Frame} alt="test" className="avatar-frame anim-spin"/>}
            </div>
           </div>
        ) : (
            <div style={{
                border: '5px solid white',
                borderRadius: '50%',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
            }}>
                <Avatars user={userData} sizeFont={80} CssClassname="avatarNiso" />
            </div>
        )}
    </div>
));

const UserInfo = React.memo(({ userData }) => (
    <Card
        bordered={false}
        style={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            borderRadius: '16px',
            height: '100%',
            padding: '8px'
        }}
    >
        <Title level={3} style={{ marginBottom: '12px', marginTop: '0' }}>
            {userData.name || 'Chưa cập nhật tên'}
        </Title>
        <Space wrap size="middle" style={{ marginBottom: '16px' }}>
            {userData.chucvu && (
                <Tooltip title="Chức vụ">
                    <Tag color="blue" style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '14px' }}>
                        <DesktopOutlined /> {userData.chucvu}
                    </Tag>
                </Tooltip>
            )}
            {userData.bophan && (
                <Tooltip title="Phòng ban">
                    <Tag color="green" style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '14px' }}>
                        <TeamOutlined /> {userData.bophan.toUpperCase()}
                    </Tag>
                </Tooltip>
            )}
            {userData.chinhanh && (
                <Tooltip title="Nhà hàng">
                    <Tag color="orange" style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '14px' }}>
                        <BankOutlined /> {userData.chinhanh}
                    </Tag>
                </Tooltip>
            )}
        </Space>

        {userData.date && (
            <Paragraph>
                <CalendarOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                <Text type="secondary">Ngày tham gia:</Text>{' '}
                <Text strong>{userData.date.split(" ")[0]}</Text>
            </Paragraph>
        )}
    </Card>
));

const NoUserData = () => (
    <div style={{ padding: '60px', textAlign: 'center' }}>
        <UserOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
        <Title level={4} style={{ marginTop: '24px', color: '#8c8c8c' }}>
            Không có dữ liệu người dùng
        </Title>
    </div>
);

const UserProfileModal = ({ userData, visible, onCancel, user, Frame, t }) => {
    // Sử dụng useMemo để tránh tính toán lại các giá trị không thay đổi
    const hasUserData = useMemo(() => userData && Object.keys(userData).length > 0, [userData]);

    const backgroundImg = useMemo(() => {
        return hasUserData && userData.imgBackground
            ? userData.imgBackground
            : backgroundProfile;
    }, [hasUserData, userData?.imgBackground]);
    
    console.log(userData?.imgBackground)

    // Chuẩn bị dữ liệu chi tiết để render
    const detailItems = useMemo(() => {
        if (!hasUserData) return [];

        return [
            {
                id: 'name',
                icon: <UserOutlined style={{ fontSize: '18px', color: '#1890ff' }} />,
                label: 'Họ và tên',
                value: userData.name
            },
            {
                id: 'chucvu',
                icon: <DesktopOutlined style={{ fontSize: '18px', color: '#52c41a' }} />,
                label: 'Chức vụ',
                value: userData.chucvu
            },
            {
                id: 'bophan',
                icon: <TeamOutlined style={{ fontSize: '18px', color: '#faad14' }} />,
                label: 'Khối / Phòng',
                value: userData.bophan
            },
            {
                id: 'chinhanh',
                icon: <BankOutlined style={{ fontSize: '18px', color: '#eb2f96' }} />,
                label: 'Nhà hàng',
                value: userData.chinhanh
            },
            {
                id: 'email',
                icon: <MailOutlined style={{ fontSize: '18px', color: '#722ed1' }} />,
                label: 'Email',
                value: userData.email
            },
            {
                id: 'phone',
                icon: <PhoneOutlined style={{ fontSize: '18px', color: '#13c2c2' }} />,
                label: 'Số điện thoại',
                value: userData.phone
            }
        ];
    }, [hasUserData, userData]);

    // Tách footer ra để tối ưu re-render
    const drawerFooter = useMemo(() => [
        <Button key="close" type="primary" onClick={onCancel} block>
            Đóng
        </Button>
    ], [onCancel]);

    return (
        <Drawer
            open={visible} // Thay 'visible' bằng 'open' để phù hợp với Ant Design v5
            onClose={onCancel}
            width={800}
            closeIcon={false}
            footer={drawerFooter}
            bodyStyle={{ padding: 0 }}
            title={null}
            className="user-profile-modal"
            centered
        >
            {hasUserData ? (
                <div className="profile-container">
                    <ProfileHeader backgroundImg={backgroundImg} />

                    <div style={{ padding: '0 28px 28px' }}>
                        <Row gutter={[24, 16]} style={{ marginTop: '-70px', position: 'relative', zIndex: 2 }}>
                            <Col xs={24} sm={7} className="text-center">
                                <UserAvatar userData={userData} Frame={Frame} user={user} />
                            </Col>
                            <Col xs={24} sm={17}>
                                <UserInfo userData={userData} />
                            </Col>
                        </Row>

                        <Divider style={{ margin: '36px 0 24px', borderColor: '#f0f0f0' }}>
                            <Space>
                                <InfoCircleOutlined style={{ color: '#ae8f3d' }} />
                                <span style={{ fontWeight: 'bold', color: '#ae8f3d' }}>Thông tin chi tiết</span>
                            </Space>
                        </Divider>

                        <Row gutter={[16, 16]}>
                            {detailItems.map(item => (
                                <Col xs={24} md={12} key={item.id}>
                                    <DetailItem
                                        icon={item.icon}
                                        label={item.label}
                                        value={item.value}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>
            ) : (
                <NoUserData />
            )}
        </Drawer>
    );
};

export default React.memo(UserProfileModal);