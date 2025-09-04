import React from 'react';
import { Avatar, Typography, Tooltip, Tag, Empty } from 'antd';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    UserOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import UserInfoCard from '../../../hook/UserInfoCard';
import Avatars from '../../../config/design/Avatars';
import useRelativeTime from '../../../hook/useRelativeTime';

const { Text } = Typography;

// Component con để xử lý thời gian tương đối
const RelativeTimeDisplay = ({ timestamp }) => {
    const relativeTime = useRelativeTime(timestamp);
    return (
        <Tooltip title={timestamp}>
            <Text style={{ fontSize: 11, color: '#999' }}>
                <ClockCircleOutlined style={{ marginRight: 3, fontSize: 10 }} />
                {relativeTime}
            </Text>
        </Tooltip>
    );
};

const HistoryUpdate = ({ historyCheck = [] }) => {
    // Hàm định dạng hành động thành tiếng Việt
    const formatAction = (action) => {
        const actions = {
            'approve': 'Phê duyệt',
            'reprocess': 'Xử lý lại',
            'assign': 'Assign',
            'complete': 'Hoàn tất',
            'pending': 'Chờ xử lý'
        };
        return actions[action] || action;
    };

    // Hàm lấy icon và màu theo action
    const getActionStyle = (action) => {
        const styles = {
            'approve': { icon: CheckCircleOutlined, color: '#52c41a', dotColor: '#52c41a' },
            'reprocess': { icon: SyncOutlined, color: '#fa8c16', dotColor: '#fa8c16' },
            'assign': { icon: UserOutlined, color: '#1890ff', dotColor: '#1890ff' },
            'complete': { icon: CheckCircleOutlined, color: '#52c41a', dotColor: '#52c41a' },
            'pending': { icon: ExclamationCircleOutlined, color: '#faad14', dotColor: '#faad14' }
        };
        return styles[action] || { icon: ClockCircleOutlined, color: '#666', dotColor: '#d9d9d9' };
    };

    // Hàm hiển thị chi tiết gọn
    // const renderCompactDetails = (details) => {
    //     if (!details) return null;
    //     const { comment, assignedTo, departments, branches, deadline } = details;

    //     return (
    //         <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 6 }}>
    //             {comment && (
    //                 <Text style={{ fontSize: 12, color: '#666', display: 'block', lineHeight: 1.4 }}>
    //                     <FileTextOutlined style={{ marginRight: 4, fontSize: 11 }} />
    //                     {comment}
    //                 </Text>
    //             )}

    //             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
    //                 {assignedTo && assignedTo.map((person, index) => (
    //                     <Tag key={`assigned-${index}`} size="small" color="blue" style={{ fontSize: 10, margin: 0 }} bordered={false}>
    //                         Người dùng: {person}
    //                     </Tag>
    //                 ))}

    //                 {departments && departments.map((dept, index) => (
    //                     <Tag key={`dept-${index}`} size="small" color="purple" style={{ fontSize: 10, margin: 0 }} bordered={false}>
    //                         Phòng ban: {dept}
    //                     </Tag>
    //                 ))}

    //                 {branches && branches.map((branch, index) => (
    //                     <Tag key={`branch-${index}`} size="small" color="cyan" style={{ fontSize: 10, margin: 0 }} bordered={false}>
    //                         Nhà hàng: {branch}
    //                     </Tag>
    //                 ))}
    //             </div>

    //             {deadline && (
    //                 <Text style={{ fontSize: 11, color: '#ff4d4f', fontWeight: 500 }}>
    //                     📅 Hạn: {deadline}
    //                 </Text>
    //             )}
    //         </Space>
    //     );
    // };

    if (!historyCheck || historyCheck.length === 0) {
        return (
            <div style={{
                padding: '30px 16px',
                textAlign: 'center',
                background: '#fafafa',
                borderRadius: 8,
                margin: 16
            }}>
                <ClockCircleOutlined style={{ fontSize: 28, color: '#d9d9d9', marginBottom: 8 }} />
                <Empty description="Chưa có lịch sử xử lý" />
            </div>
        );
    }

    return (
        <div style={{ padding: '16px 12px' }}>
            <div style={{ position: 'relative' }}>
                {/* Timeline Line */}
                <div style={{
                    position: 'absolute',
                    left: 18,
                    top: 20,
                    bottom: 20,
                    width: 2,
                    background: 'linear-gradient(to bottom, #e6f7ff, #f6ffed)',
                    borderRadius: 1
                }} />

                {/* Timeline Items */}
                {historyCheck.map((item, index) => {
                    const actionStyle = getActionStyle(item.action);
                    const IconComponent = actionStyle.icon;
                    const isLast = index === historyCheck.length - 1;

                    return (
                        <div key={index} style={{
                            position: 'relative',
                            paddingLeft: 48,
                            paddingBottom: isLast ? 0 : 20,
                            marginBottom: isLast ? 0 : 8
                        }}>
                            {/* Timeline Dot */}
                            <div style={{
                                position: 'absolute',
                                left: 8,
                                top: 2,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <IconComponent style={{
                                    fontSize: 16,
                                    color: actionStyle.dotColor
                                }} />
                            </div>

                            {/* Content Card */}
                            <div style={{
                                background: 'white',
                                borderRadius: 8,
                                padding: 12,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                border: '1px solid #f0f0f0',
                                position: 'relative'
                            }}>
                                {/* Arrow pointing to timeline */}
                                <div style={{
                                    position: 'absolute',
                                    left: -6,
                                    top: 12,
                                    width: 0,
                                    height: 0,
                                    borderTop: '6px solid transparent',
                                    borderBottom: '6px solid transparent',
                                    borderRight: '6px solid white'
                                }} />

                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    {/* Avatar */}
                                    <Tooltip
                                        title={<UserInfoCard user={item.user} />}
                                        placement="topLeft"
                                        color="white"
                                        overlayStyle={{ maxWidth: 280 }}
                                    >
                                        <div style={{ flexShrink: 0 }}>
                                            {item.user.imgAvatar ? (
                                                <Avatar
                                                    src={item.user.imgAvatar}
                                                    size={32}
                                                    style={{ border: '2px solid #f0f0f0' }}
                                                    onError={() => false}
                                                />
                                            ) : (
                                                <Avatars user={{ name: item.user.name ?? 'N/A' }} sizeImg={32} />
                                            )}
                                        </div>
                                    </Tooltip>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Header */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            marginBottom: 4,
                                            flexWrap: 'wrap'
                                        }}>
                                            <Text strong style={{ fontSize: 13, color: '#333' }}>
                                                {item.user.name} đã thay đổi trạng thái
                                            </Text>
                                            <Tag
                                                color={actionStyle.color}
                                                style={{
                                                    fontSize: 10,
                                                    margin: 0,
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {formatAction(item.action)}
                                            </Tag>
                                        </div>

                                        {/* Time */}
                                        <div style={{ marginBottom: 6 }}>
                                            <RelativeTimeDisplay timestamp={item.timestamp} />
                                        </div>

                                        {/* Details */}
                                        {/* {renderCompactDetails(item.details)} */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryUpdate;