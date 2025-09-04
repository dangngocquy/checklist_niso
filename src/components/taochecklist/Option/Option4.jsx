import React, { useState, useEffect } from 'react';
import { Form, Select, Button } from 'antd';
import { StarOutlined, HeartOutlined, CheckCircleOutlined, FieldBinaryOutlined } from '@ant-design/icons';

const { Option } = Select;

const Option4 = ({ field, form, t }) => {
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [selectedNumber, setSelectedNumber] = useState(0);

    useEffect(() => {
        const icon = form.getFieldValue(['questions', field.name, 'luachonbieutuong']);
        const number = form.getFieldValue(['questions', field.name, 'plusnumber']);
        setSelectedIcon(icon);
        setSelectedNumber(number);
    }, [field.name, form]);

    const renderIcons = () => {
        if (!selectedIcon || !selectedNumber) return null;
        const icons = {
            ngoisao: StarOutlined,
            traitim: HeartOutlined,
            daukiem: CheckCircleOutlined,
        };

        return Array(selectedNumber).fill().map((_, index) => {
            if (selectedIcon === 'so') {
                return (
                    <Button size="large" shape='circle' key={index} style={{ marginRight: 16, }} disabled>
                        {index + 1}
                    </Button>
                );
            } else {
                const IconComponent = icons[selectedIcon];
                return (
                    <Button size="large" shape='circle' key={index} style={{ marginRight: 16, }} disabled>
                        <IconComponent />
                    </Button>
                );
            }
        });
    };

    return (
        <>
            <Form.Item
                name={[field.name, 'plusnumber']}
                fieldKey={[field.fieldKey, 'plusnumber']}
                rules={[{ required: true, message: t('Department.input236') }]}
            >
                <Select
                    placeholder="Chọn mức độ"
                    onChange={(value) => setSelectedNumber(value)}
                >
                    {[...Array(10).keys()].map(i => (
                        <Option key={i + 1} value={i + 1}>{i + 1}</Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name={[field.name, 'luachonbieutuong']}
                fieldKey={[field.fieldKey, 'luachonbieutuong']}
                rules={[{ required: true, message: t('Department.input237') }]}
            >
                <Select
                    placeholder="Chọn icon"
                    onChange={(value) => setSelectedIcon(value)}
                >
                    <Option value="ngoisao">{t('Create.input22')}<StarOutlined /></Option>
                    <Option value="traitim">{t('Create.input23')} <HeartOutlined /></Option>
                    <Option value="daukiem">{t('Create.input24')}<CheckCircleOutlined /></Option>
                    <Option value="so">{t('Create.input25')} <FieldBinaryOutlined /></Option>
                </Select>
            </Form.Item>
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', rowGap: 7.5 }}>
                {renderIcons()}
            </div>
        </>
    );
};

export default React.memo(Option4);