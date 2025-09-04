import React, { useState, useEffect } from "react";
import axios from "axios";
import { Select, Button, message } from "antd";

const { Option } = Select;

const Share = React.memo(({ record, t }) => {
    const [data, setData] = useState([]);
    const [data2, setDoc2] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedShareId, setSelectedShareId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axios.get('/docs/all')
            .then(response => {
                setData(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    };

    useEffect(() => {
        const fetchData2 = async () => {
            try {
                const response = await axios.get('/share/all');
                setDoc2(response.data);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };

        fetchData2();
    }, []);

    useEffect(() => {
        if (data2.length > 0 && record.keys) {
            const selectedDoc = data2.find(item => item.keysaccount === record.keys);
            if (selectedDoc) {
                setSelectedItemId(selectedDoc.idchecklist);
                setSelectedShareId(selectedDoc.id);
            } else {
                setSelectedItemId(null);
                setSelectedShareId(null);
            }
        }
    }, [data2, record.keys]);

    const handleSelectChange = (value) => {
        setSelectedItemId(value);
    };

    const handleAddOrUpdateShare = () => {
        if (!selectedItemId) {
            console.error("Please select an item");
            return;
        }

        if (selectedShareId) {
            axios.put(`/share/update/${selectedShareId}`, {
                id: selectedShareId,
                idchecklist: selectedItemId,
                keysaccount: record.keys
            })
                .then(response => {
                    console.log("Updated successfully:", response.data);
                    message.success(t('Department.input147'));
                })
                .catch(error => {
                    console.error("Error updating:", error);
                    message.error('Có lỗi xảy ra!');
                });
        } else {
            axios.post('/share/add', {
                idchecklist: selectedItemId,
                keysaccount: record.keys
            })
                .then(response => {
                    console.log("Shared successfully:", response.data);
                    message.success(t('Department.input148'));
                    setDoc2([...data2, response.data]);
                })
                .catch(error => {
                    console.error("Error sharing:", error);
                    message.error('Có lỗi xảy ra!');
                });
        }
    };

    return (
        <div>
            <p style={{ marginBottom: '15px' }}>
                {t('Department.input134')}
            </p>
            <Select
                value={selectedItemId}
                style={{ width: 200 }}
                onChange={handleSelectChange}
            >
                <Option value={null}>{t('Notifications.input34')}</Option>
                {data.map(item => (
                    <Option key={item.id} value={item.id}>{item.title}</Option>
                ))}
            </Select>
            <Button type="primary" onClick={handleAddOrUpdateShare} style={{ marginLeft: '15px' }}>{t('ViewDocs.input10')}
            </Button>
        </div>
    );
});

export default Share;
