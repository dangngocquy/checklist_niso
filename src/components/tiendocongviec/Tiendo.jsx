import React, { useState, useEffect } from 'react';
import Breadcrumbs from "../linkmenu/Breadcrumbs";
import { Settings } from "../linkmenu/Data";
import axios from 'axios';
import Thoigian from '../../config/date';
import { message, Button, Table, DatePicker, Spin, Input, Select, Drawer, Form, Card } from 'antd';

const { Option } = Select;
const Tiendo = React.memo(({ bophan, phanquyen, t }) => {
    const [keysData, setKeysData] = useState([]);
    const [docs, setDocs] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [title, setTitle] = useState(null);
    const [account, setAccount] = useState(null);
    const [checklist, setChecklist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [giaoviecList, setGiaoviecList] = useState([]);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const Dates = Thoigian();
    const settingsWithTranslation = Settings(t, phanquyen);

    useEffect(() => {
        const fetchGiaoviecList = async () => {
            try {
                const response = await axios.get('/giaoviec/all');
                setGiaoviecList(response.data.giaoviecList);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching giaoviec:', error);
                setLoading(false);
            }
        };

        fetchGiaoviecList();
    }, []);

    useEffect(() => {
        const fetchKeysData = async () => {
            try {
                const response = await axios.get('/users/all');
                const { data } = response;
                if (data.docs && data.docs.length > 0) {
                    setKeysData(data.docs);
                }
            } catch (error) {
                console.error('Error fetching keysData:', error);
            }
        };

        fetchKeysData();
    }, []);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const response = await axios.get('/docs/all');
                setDocs(response.data);
            } catch (error) {
                message.error(`Lỗi: ${error}`);
            }
        };

        fetchDocs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !account.trim() || !checklist.trim() || !selectedDate) {
            message.warning(t('Department.input58'));
            return;
        }
        try {
            const response = await axios.post('/giaoviec/add', {
                bophans: bophan,
                title,
                account,
                checklist,
                date: Dates,
            });
            message.success(t('Department.input77'));
            console.log(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const columns = [
        {
            title: t('Input.input7'),
            dataIndex: 'index',
            key: 'index',
            render: (text, record, index) => index + 1
        },
        {
            title: t('Department.input78'),
            dataIndex: 'title',
            key: 'title'
        },
        {
            title: t('Department.input79'),
            dataIndex: 'account',
            key: 'account'
        },
        {
            title: t('Department.input80'),
            dataIndex: 'date',
            key: 'date'
        },
        {
            title: t('Department.input81'),
            dataIndex: 'thoigian',
            key: 'thoigian'
        },
        {
            title: t('Department.input82'),
            dataIndex: 'action1',
            key: 'action1',
            render: () => 'Coming soon'
        },
        {
            title: t('Department.input83'),
            dataIndex: 'action2',
            key: 'action2',
            render: () => 'Coming soon'
        }
    ];

    return (
        <>
            <Breadcrumbs paths={settingsWithTranslation} />
            <title>NISO | {t('Department.input10')}</title>
            <Card>
                <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>{t('Department.input11')}</p>
                <div>
                    <span style={{ display: 'flex', gap: '15px', marginTop: '15px', marginBlock: '15px' }}>
                        <Button type='primary' onClick={() => setDrawerVisible(true)}>{t('Department.input143')}</Button>
                        <Button>{t('Department.input13')}</Button>
                    </span>
                    <div>
                        <div style={{ overflowX: 'auto' }}>
                            <Spin spinning={loading}>
                                <Table
                                    dataSource={giaoviecList}
                                    columns={columns}
                                    rowKey='id'
                                />
                            </Spin>
                        </div>
                        <Drawer
                            title={t('Department.input143')}
                            placement="right"
                            closable={true}
                            onClose={() => setDrawerVisible(false)}
                            visible={drawerVisible}
                            width={360}
                        >
                            <Form layout="vertical">
                                <Form.Item label={t('Department.input15')}>
                                    <Input placeholder={t('Department.input23')} value={title} onChange={(e) => setTitle(e.target.value)} className='question-container-niso-question' />
                                </Form.Item >

                                <Form.Item label={t('Department.input16')}>
                                    <Select value={account} onChange={(value) => setAccount(value)} style={{ width: '100%' }} placeholder="Chọn tài khoản">
                                        {keysData.map((item, index) => (
                                            <Option key={index} value={item.username}>
                                                {item.username}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item >

                                <Form.Item label={t('Department.input17')}>
                                    <Select value={checklist} onChange={(value) => setChecklist(value)} style={{ width: '100%' }} placeholder="Chọn checklist">
                                        {docs.map((item, index) => (
                                            <Option key={index} value={item.title}>
                                                {item.title}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item >

                                <Form.Item label={t('Department.input86')} >
                                    <DatePicker
                                        selected={selectedDate}
                                        placeholderText={`${t("Department.input6")}`}
                                        style={{ width: '100%' }}
                                        onChange={date => setSelectedDate(date)}
                                    />
                                </Form.Item >
                                <Form.Item>
                                    <Button onClick={handleSubmit} type='primary'>{t('Department.input14')}</Button>
                                </Form.Item >
                            </Form>
                        </Drawer>
                    </div>
                </div>
            </Card>
        </>
    );
});

export default Tiendo;
