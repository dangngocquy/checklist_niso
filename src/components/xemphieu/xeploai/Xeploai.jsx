import axios from "axios";
import React, { useEffect, useState } from "react";
import Breadcrumbs from "../linkmenu/Breadcrumbs";
import { Settings } from "../linkmenu/Data";
import Thoigian from "../../config/date";
import { Table, message, Spin, Select, Input, Button, Drawer, Popconfirm, Form, Card, Avatar } from "antd";

const Xeploai = React.memo(({ phanquyen, bophan, keys, name, t }) => {
    const Date = Thoigian();
    const { Option } = Select;
    const [departments, setDepartments] = useState([]);
    const [tableAData, setTableAData] = useState([]);
    const [keysData, setKeysData] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [activeTab, setActiveTab] = useState('tyLe');
    const [xepLoaiData, setXepLoaiData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filteredXepLoaiData, setFilteredXepLoaiData] = useState([]);
    const [showAddButton, setShowAddButton] = useState(true);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [formData, setFormData] = useState({
        xeploai: '',
        diem: '',
        tyle: '',
        color: '',
        bophanxl: '',
        diemden: '',
        tyleden: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/users/all');
                const { data } = response;
                if (data.docs && data.docs.length > 0) {
                    const keysValues = data.docs.map(doc => doc.keys);
                    setKeysData(keysValues);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const response = await axios.get(`/xeploai/all`);
                setXepLoaiData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const response = await axios.get(`/users/all`);
                const { docsUser } = response.data;
                setDepartments(docsUser);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [setDepartments]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`/tablea/all`);
                setTableAData(response.data.data);
                const hasPermission = phanquyen || response.data.data.some(item => item.bophan.toLowerCase() === bophan.toLowerCase());
                if (response.data.data.length > 0 && hasPermission) {
                    const firstItem = response.data.data.find(item => phanquyen || item.bophan.toLowerCase() === bophan.toLowerCase());
                    setSelectedDepartment(firstItem.bophan.toLowerCase());
                    const filteredData = xepLoaiData.filter(
                        (item) => item.bophanxl.toLowerCase() === firstItem.bophan.toLowerCase()
                    );
                    setFilteredXepLoaiData(filteredData);
                }
            } catch (error) {
                console.error('Error retrieving data:', error);
            }
        };

        fetchData();
    }, [phanquyen, bophan, setTableAData, xepLoaiData]);

    const handleDepartmentChange = (department) => {
        setSelectedDepartment(department);
        const filteredData = xepLoaiData.filter(
            (item) => item.bophanxl.toLowerCase() === department.toLowerCase()
        );
        setFilteredXepLoaiData(filteredData);
    };

    const handleChange = (value, name) => {
        setFormData({
            ...formData,
            [name]: value.color,
        });
    };

    const handleSubmit = async (e) => {
        let responseThongbao;
        e.preventDefault();
        if (!formData.bophanxl || !formData.xeploai || !formData.diemden || !formData.tyleden || (!formData.diem && activeTab === 'mucDiem') || (!formData.tyle && activeTab === 'tyLe') || !formData.color) {
            message.warning(t('Report.input16'));
            return;
        }
        const filteredXepLoai = xepLoaiData.filter(item => item.bophanxl === formData.bophanxl);
        const xepLoaiExists = filteredXepLoai.some(item => item.xeploai === formData.xeploai);
        if (xepLoaiExists) {
            message.warning(t('ViewDocs.input1'));
        } else {
            try {
                await axios.post('/xeploai/add', formData);
                console.log('Data added successfully');
                message.success(t('ViewDocs.input4'));
                const filteredDoc = xepLoaiExists.find(item => item.bophanxl === formData.bophanxl);
                const users = keysData.map((keysusers) => ({
                    check: true,
                    keysusers: keysusers,
                    thoigian: Date,
                    bophanAD: bophan,
                    keysthongbao: keys,
                    nguoitaophieu: name,
                    thongbaoxoaphieu: keysusers === keys ? `Bạn vừa tạo một danh sách xếp loại cho phòng ban ${filteredDoc}` : `${name} ${t('Department.input29')} ${bophan} vừa tạo một danh sách xếp loại cho phòng ban ${filteredDoc}`,
                }));
                responseThongbao = await axios.post(`/notification`, {
                    users: users
                });
                console.log('Thongbao sent successfully:', responseThongbao.data);
                setShowAddButton(false);
                setDrawerVisible(false);
            } catch (error) {
                console.error('Error adding data:', error);
            }
        }
    };

    const handleEdit = async () => {
        try {
            const selected = xepLoaiData.find(item => item.id === formData.id);
            if (
                selected.xeploai === formData.xeploai &&
                selected.diem === formData.diem &&
                selected.tyle === formData.tyle &&
                selected.color === formData.color &&
                selected.bophanxl === formData.bophanxl &&
                selected.diemden === formData.diemden &&
                selected.tyleden === formData.tyleden
            ) {
                message.warning(t('Edit.input2'));
                return;
            }

            await axios.put(`/xeploai/update/${formData.id}`, formData);
            const updatedXepLoaiData = xepLoaiData.map(item => {
                if (item.id === formData.id) {
                    return formData;
                }
                return item;
            });
            setXepLoaiData(updatedXepLoaiData);
            setFormData({
                xeploai: '',
                diem: '',
                tyle: '',
                color: '',
                bophanxl: '',
                diemden: '',
                tyleden: ''
            });
            message.success(t('ViewDocs.input2'));
            setShowAddButton(false);
            setDrawerVisible(false);
        } catch (error) {
            console.error('Error updating data:', error);
            message.error("Lỗi khi cập nhật dữ liệu");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/xeploai/delete/${id}`);
            const updatedXepLoaiData = xepLoaiData.filter(item => item.id !== id);
            setXepLoaiData(updatedXepLoaiData);
            message.success(t('ViewDocs.input3'));
        } catch (error) {
            console.error('Error deleting data:', error);
            message.error("Lỗi khi xóa xếp loại");
        }
    };

    const handleAdminSelection = (id) => {
        const selected = xepLoaiData.find(item => item.id === id);
        setFormData({
            id: id,
            xeploai: selected.xeploai,
            diem: selected.diem,
            tyle: selected.tyle,
            color: selected.color,
            bophanxl: selected.bophanxl,
            diemden: selected.diemden,
            tyleden: selected.tyleden
        });
        setShowAddButton(false);
        setDrawerVisible(true);
    };

    const columns = [
        {
            title: 'Color',
            key: 'Color',
            render: (text, result) => <Avatar style={{ backgroundColor: result.color, border: '1px solid black' }} size='large'></Avatar>,
        },
        {
            title: t('Input.input7'),
            dataIndex: 'index',
            key: 'index',
            render: (text, record, index) => index + 1,
        },
        {
            title: t('Input.input8'),
            dataIndex: 'xeploai',
            key: 'xeploai',
        },
        {
            title: t('Input.input9'),
            dataIndex: 'diem',
            key: 'diem',
            render: (text, record) => `${record.diem} - ${record.diemden}`,
        },
        {
            title: t('Input.input10'),
            dataIndex: 'tyle',
            key: 'tyle',
            render: (text, record) => `${record.tyle}% - ${record.tyleden}%`,
        },
        {
            title: t('Create.input11'),
            key: 'actions',
            render: (text, record) => (
                <span style={{ display: 'flex', gap: '15px' }}>
                    <Button type="primary" onClick={() => handleAdminSelection(record.id)}>Edit</Button>
                    <Popconfirm
                        title={t('Department.input115')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('ViewDocs.input10')}
                        cancelText={t('Input.input23')}
                    >
                        <Button type="primary">
                            {t('Delete')}
                        </Button>
                    </Popconfirm>
                </span>
            ),
        },
    ];

    const dataSource = filteredXepLoaiData
        .filter(item => bophan.toLowerCase() === item.bophanxl.toLowerCase())
        .map((item, index) => ({
            ...item,
            key: index,
        }));

    const columns2 = [
        {
            title: 'Color',
            key: 'Color',
            render: (text, result) => <Avatar style={{ backgroundColor: result.color, border: '1px solid black' }} size='large'></Avatar>,
        },
        {
            title: t('Input.input7'),
            dataIndex: 'index',
            key: 'index',
            render: (text, record, index) => index + 1,
        },
        {
            title: t('Input.input8'),
            dataIndex: 'xeploai',
            key: 'xeploai',
        },
        {
            title: t('Input.input9'),
            dataIndex: 'diem',
            key: 'diem',
            render: (text, record) => `${record.diem} - ${record.diemden}`,
        },
        {
            title: t('Input.input10'),
            dataIndex: 'tyle',
            key: 'tyle',
            render: (text, record) => `${record.tyle}% - ${record.tyleden}%`,
        },
    ];

    if (phanquyen === true || (bophan.toLowerCase() && tableAData.some(item => item.bophan.toLowerCase() === bophan.toLowerCase() && item.xeploai === true))) {
        columns2.push({
            title: t('Create.input11'),
            key: 'actions',
            render: (text, record) => (
                <span style={{ display: 'flex', gap: '15px' }}>
                    <Button type="primary" onClick={() => handleAdminSelection(record.id)}>Edit</Button>
                    <Popconfirm
                        title={t('Department.input115')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('ViewDocs.input10')}
                        cancelText={t('Input.input23')}
                    >
                        <Button type="primary">
                            {t('Delete')}
                        </Button>
                    </Popconfirm>
                </span>
            ),
        });
    }
    const dataSource2 = filteredXepLoaiData.map((item, index) => ({
        ...item,
        key: index,
    }));


    filteredXepLoaiData.sort((a, b) => {
        const scoreA = parseFloat(a.diem);
        const scoreB = parseFloat(b.diem);
        const ratioA = parseFloat(a.tyle);
        const ratioB = parseFloat(b.tyle);

        if (scoreA < scoreB) return 1;
        if (scoreA > scoreB) return -1;
        if (ratioA < ratioB) return 1;
        if (ratioA > ratioB) return -1;
        return 0;
    });

    const settingsWithTranslation = Settings(t, phanquyen);
    const filteredDepartments = phanquyen ? tableAData : tableAData.filter(item => item.bophan.toLowerCase() === bophan.toLowerCase());

    return (
        <>
            <Breadcrumbs paths={settingsWithTranslation} />
            <title>NISO | {t('Input.input4')}</title>
            <Card>
            <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>{t('Input.input6')}</p>
                <div>
                    <div className={phanquyen === true || (bophan.toLowerCase() && tableAData.some(item => item.bophan.toLowerCase() === bophan.toLowerCase() && item.xeploai === true)) ? '' : ''}>
                        <span>
                            <div>
                                <Select
                                    style={{ width: '100%', textTransform: 'uppercase' }}
                                    value={selectedDepartment}
                                    onChange={handleDepartmentChange}
                                    placeholder={t('Department.input20')}
                                >
                                    {filteredDepartments.map((item) => (
                                        <Option key={item.bophan} value={item.bophan.toLowerCase()} style={{ textTransform: 'uppercase' }}>
                                            {item.bophan}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                            {(phanquyen === true || (bophan.toLowerCase() && tableAData.some(item => item.bophan.toLowerCase() === bophan.toLowerCase() && item.xeploai === true))) && (
                                <Button type="primary" onClick={() => {
                                    setFormData({
                                        xeploai: '',
                                        diem: '',
                                        tyle: '',
                                        color: '',
                                        bophanxl: '',
                                        diemden: '',
                                        tyleden: ''
                                    });
                                    setDrawerVisible(true);
                                }}
                                    style={{ marginTop: '15px' }}>{t('Department.input114')}</Button>
                            )}
                            <Spin spinning={loading}>
                                {filteredXepLoaiData.length === 0 ? (
                                    <Table
                                        columns={columns}
                                        dataSource={dataSource}
                                        pagination={{ pageSize: 5 }}
                                        scroll={{ x: true }}
                                        style={{ width: '100%', marginTop: '15px' }}
                                    />
                                ) : (
                                    <Table
                                        columns={columns2}
                                        dataSource={dataSource2}
                                        pagination={{ pageSize: 5 }}
                                        scroll={{ x: true }}
                                        style={{ width: '100%', marginTop: '15px' }}
                                    />
                                )}
                            </Spin>
                        </span>
                        {(phanquyen === true || (bophan.toLowerCase() && tableAData.some(item => item.bophan.toLowerCase() === bophan.toLowerCase() && item.xeploai === true))) && (
                            <div>
                                <Drawer
                                    title={showAddButton ? t('Input.input12') : t('Input.input13')}
                                    placement="right"
                                    closable={true}
                                    onClose={() => {
                                        setShowAddButton(true);
                                        setDrawerVisible(false);
                                    }}
                                    visible={drawerVisible}
                                    width={360}
                                >
                                    <Form layout="vertical">
                                        <Form.Item label={t('Header.header3')}>
                                            <Select
                                                name="bophanxl"
                                                value={formData.bophanxl || undefined}
                                                placeholder={t('Input.input')}
                                                onChange={value => handleChange({ target: { name: 'bophanxl', value } })}
                                                style={{ textTransform: 'uppercase' }}
                                            >
                                                {departments.slice().reverse().map(department => (
                                                    <Option value={department.bophan} key={department.keys} style={{ textTransform: 'uppercase' }}>{department.bophan}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item label={t('Input.input24')}>
                                            <Input type="text" style={{ color: 'black' }} placeholder={t('Input.input24')} name="xeploai" value={formData.xeploai} onChange={handleChange} />
                                        </Form.Item >
                                        <Form.Item layout="vertical">
                                            <Button type={activeTab === 'tyLe' ? 'primary' : ''} style={{ cursor: 'pointer', marginRight: '15px' }} onClick={() => setActiveTab('tyLe')}>
                                                {t('Input.input14')}
                                            </Button>
                                            <Button type={activeTab === 'mucDiem' ? 'primary' : ''} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('mucDiem')}>
                                                {t('Input.input15')}
                                            </Button>
                                        </Form.Item>

                                        {activeTab === 'tyLe' &&
                                            <>
                                                <Form.Item label={t('Input.input16')}>
                                                    <Input type="number" style={{ color: 'black' }} placeholder={t('Input.input25')} name="tyle" value={formData.tyle} onChange={handleChange} />
                                                </Form.Item>
                                                <Form.Item label={t('Input.input17')}>
                                                    <Input type="number" style={{ color: 'black' }} placeholder={t('Input.input26')} name="tyleden" value={formData.tyleden} onChange={handleChange} />
                                                </Form.Item >
                                            </>
                                        }
                                        {activeTab === 'mucDiem' &&
                                            <>
                                                <Form.Item label={t('Input.input18')}>
                                                    <Input type="number" style={{ color: 'black' }} placeholder={t('Input.input27')} name="diem" value={formData.diem} onChange={handleChange} />
                                                </Form.Item>
                                                <Form.Item label={t('Input.input17')}>
                                                    <Input type="number" style={{ color: 'black' }} placeholder={t('Input.input28')} name="diemden" value={formData.diemden} onChange={handleChange} />
                                                </Form.Item>
                                            </>
                                        }
                                        <Form.Item label={t('Input.input19')}>
                                            <Input type="color" name="color" value={formData.color} onChange={handleChange} />
                                        </Form.Item>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                                            <span style={{ fontSize: 'small' }}>
                                                {showAddButton ? (
                                                    <Button type="primary" onClick={handleSubmit}>{t('Input.input20')}</Button>
                                                ) : (
                                                    <Button type="primary" onClick={() => handleEdit(formData.id)}>{t('Input.input21')}</Button>
                                                )}
                                            </span>
                                        </div>
                                    </Form>
                                </Drawer>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </>
    );
});

export default Xeploai;
