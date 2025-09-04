import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { List, message, Avatar, Tooltip, Skeleton, Empty, Button, Typography, Tabs, Select, DatePicker, Space, Alert, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { MessageOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { getAvatarColor } from "../../config/design/ColorAvatar";
import moment from "moment";

const { Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const ToanBoXuLy = React.memo(({ user, t }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(5);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState("1");
    const [selectedTitle, setSelectedTitle] = useState(null);
    const [selectedCauhoi, setSelectedCauhoi] = useState(null);
    const [selectedChiNhanh, setSelectedChiNhanh] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [users, setUsers] = useState([]);
    const userRef = useRef(user);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const fetchData = useCallback(async () => {
        if (!userRef.current || !userRef.current.keys || hasFetched) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [response, usersResponse] = await Promise.all([
                axios.get('/traloi/all', {
                    timeout: 5000,
                }),
                axios.get('/users/all')
            ]);

            const filteredData = response.data.flatMap(item =>
                item.questions
                    .filter(question =>
                        question.cautraloi &&
                        question.answer &&
                        question.cautraloi !== question.answer &&
                        userRef.current &&
                        userRef.current.keys &&
                        item.keysJSON &&
                        question.xulynhiemvu !== undefined
                    )
                    .map(question => ({ ...item, question }))
            );

            const sortedData = filteredData.sort((a, b) => {
                const dateA = moment(a.ngay_phan_hoi, "DD-MM-YYYY HH:mm:ss");
                const dateB = moment(b.ngay_phan_hoi, "DD-MM-YYYY HH:mm:ss");
                return dateB - dateA;
            });

            setUsers(usersResponse.data);

            setData(prevData => {
                if (JSON.stringify(prevData) !== JSON.stringify(sortedData)) {
                    return sortedData;
                }
                return prevData;
            });
            setHasFetched(true);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Lỗi máy chủ, vui lòng làm mới trang !');
        } finally {
            setLoading(false);
        }
    }, [hasFetched]);

    useEffect(() => {
        if (userRef.current && userRef.current.keys) {
            fetchData();
        }
    }, [fetchData]);

    const renderAvatar = (keysJSON) => {
        const matchedUser = users.find(u => u.keys === keysJSON);
        return (
            <Tooltip title={matchedUser?.name || "Unknown User"}>
                {matchedUser?.imgAvatar ? (
                    <Avatar src={matchedUser.imgAvatar} size="large" />
                ) : (
                    <Avatar style={{ backgroundColor: getAvatarColor(matchedUser?.name?.[0] || '?') }} size="large">
                        {matchedUser?.name ? matchedUser.name[0].toUpperCase() : '?'}
                    </Avatar>
                )}
            </Tooltip>
        );
    };

    const loadMore = () => {
        setLoadingMore(true);
        setTimeout(() => {
            setDisplayCount(prevCount => prevCount + 5);
            setLoadingMore(false);
        }, 1000);
    };

    const renderAllQuestions = (question) => {
        return Object.keys(question)
            .filter(key => key.startsWith('Cauhoi'))
            .map(key => question[key])
            .filter(Boolean)
            .join(' ');
    };

    const countReplies = (replies) => {
        if (!replies || !Array.isArray(replies)) {
            return 0;
        }

        let sum = replies.length;

        for (let reply of replies) {
            if (reply.traloi && Array.isArray(reply.traloi)) {
                sum += countReplies(reply.traloi);
            }
        }

        return sum;
    };

    const renderItem = (item) => (
        <List.Item key={`${item.id}-${item.question.id}`}
            onClick={() => navigate(`/auth/docs/form/views/${item.id}/${item.question.id}`)}
            actions={[
                <Space direction='horizontal'>
                    <MessageOutlined />{countReplies(item.question.replies)}
                </Space>,
                <Text type="secondary" style={{ fontSize: 11 }}><FieldTimeOutlined /> {item.ngay_phan_hoi}</Text>
            ]}
            extra={<Space direction='horizontal' align="center">
                <Tag color="blue">{item.chi_nhanh}</Tag>
                <Alert
                    message={item.question.xulynhiemvu ? "Đã xử lý" : "Chờ xử lý"}
                    type={item.question.xulynhiemvu ? "success" : "info"}
                    showIcon
                    style={{ padding: '2px 8px' }}
                />
            </Space>}
        >
            <List.Item.Meta
                avatar={renderAvatar(item.keysJSON)}
                title={item.title || 'Untitled'}
                description={<div dangerouslySetInnerHTML={{ __html: renderAllQuestions(item.question) || 'Untitled Question' }} />}
            />

        </List.Item>
    );

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesTitle = !selectedTitle || item.title === selectedTitle;
            const matchesCauhoi = !selectedCauhoi || renderAllQuestions(item.question).includes(selectedCauhoi);
            const matchesChiNhanh = !selectedChiNhanh || item.chi_nhanh === selectedChiNhanh;
            const matchesDate = (!startDate || moment(item.ngay_phan_hoi, "DD-MM-YYYY HH:mm:ss").isSameOrAfter(startDate, 'day')) &&
                (!endDate || moment(item.ngay_phan_hoi, "DD-MM-YYYY HH:mm:ss").isSameOrBefore(endDate, 'day'));
            const matchesTab = (activeTab === "1" && !item.question.xulynhiemvu) || (activeTab === "2" && item.question.xulynhiemvu);
            return matchesTitle && matchesCauhoi && matchesChiNhanh && matchesDate && matchesTab;
        });
    }, [data, selectedTitle, selectedCauhoi, selectedChiNhanh, startDate, endDate, activeTab]);

    const uniqueTitles = useMemo(() => [...new Set(data.map(item => item.title))], [data]);
    const uniqueChiNhanh = useMemo(() => [...new Set(data.map(item => item.chi_nhanh))], [data]);

    const uniqueCauhoi = useMemo(() => {
        const allCauhoi = data
            .filter(item => !selectedTitle || item.title === selectedTitle)
            .flatMap(item =>
                Object.keys(item.question)
                    .filter(key => key.startsWith('Cauhoi'))
                    .map(key => item.question[key])
            )
            .filter(Boolean);
        return [...new Set(allCauhoi)];
    }, [data, selectedTitle]);

    return (
        <div style={{ padding: 8, borderRadius: 8 }}>
            <title>NISO CHECKLIST | Danh sách yêu cầu</title>
            <Space direction='vertical'>
                <span style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'left', textTransform: 'uppercase' }}>Danh sách yêu cầu</span>
                <Space style={{ marginBottom: 16, flexWrap: 'wrap' }} direction='horizontal'>
                    <Select
                        placeholder="Chọn checklist..."
                        onChange={value => {
                            setSelectedTitle(value);
                            setSelectedCauhoi(null);
                        }}
                        allowClear
                        showSearch
                    >
                        {uniqueTitles.map(title => (
                            <Option key={title} value={title}>{title}</Option>
                        ))}
                    </Select>
                    <Select
                        style={{ width: 200 }}
                        placeholder="Chọn Câu hỏi"
                        onChange={value => setSelectedCauhoi(value)}
                        allowClear
                        disabled={!selectedTitle}
                        showSearch
                    >
                        {uniqueCauhoi.map(cauhoi => (
                            <Option key={cauhoi} value={cauhoi}>
                                <div dangerouslySetInnerHTML={{ __html: cauhoi }} />
                            </Option>
                        ))}
                    </Select>
                    <Select
                        style={{ width: 200 }}
                        placeholder="Chọn Chi nhánh"
                        onChange={value => setSelectedChiNhanh(value)}
                        allowClear
                        showSearch
                    >
                        {uniqueChiNhanh.map(chiNhanh => (
                            <Option key={chiNhanh} value={chiNhanh}>{chiNhanh}</Option>
                        ))}
                    </Select>
                    <Space>
                        <DatePicker
                            placeholder={t('ListDocs.input28')}
                            onChange={(date) => setStartDate(date)}
                            format="DD-MM-YYYY"
                        />
                        <DatePicker
                            placeholder={t('ListDocs.input29')}
                            onChange={(date) => setEndDate(date)}
                            format="DD-MM-YYYY"
                        />
                    </Space>
                </Space>
            </Space>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab={t('Chờ xử lý')} key="1">
                    {loading ? (
                        <Skeleton active />
                    ) : filteredData.length === 0 ? (
                        <Empty description={t('ListEdits.input2')} />
                    ) : (
                        <>
                            <List
                                itemLayout="vertical"
                                dataSource={filteredData.slice(0, displayCount)}
                                renderItem={renderItem}
                            />
                            {displayCount < filteredData.length && (
                                <div style={{ textAlign: 'center', marginTop: 16 }}>
                                    <Button onClick={loadMore} loading={loadingMore}>
                                        {t('Profile.input32')}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabPane>
                <TabPane tab={t('Đã xử lý')} key="2">
                    {loading ? (
                        <Skeleton active />
                    ) : filteredData.length === 0 ? (
                        <Empty description={t('ListEdits.input2')} />
                    ) : (
                        <>
                            <List
                                itemLayout="vertical"
                                dataSource={filteredData.slice(0, displayCount)}
                                renderItem={renderItem}
                            />
                            {displayCount < filteredData.length && (
                                <div style={{ textAlign: 'center', marginTop: 16 }}>
                                    <Button onClick={loadMore} loading={loadingMore}>
                                        {t('Profile.input32')}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabPane>
            </Tabs>
        </div>
    );
});

export default ToanBoXuLy;