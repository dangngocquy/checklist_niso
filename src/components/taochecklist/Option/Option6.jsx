import React from 'react';
import { Input, Form, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const Option6 = React.memo(({ index, field, handleFileUpload, t }) => {
    const { TextArea } = Input;
    return (
        <>
            <Upload
                beforeUpload={(file) => {
                    handleFileUpload(file, index);
                    return false;
                }}
                multiple
            >
                <Button icon={<UploadOutlined />}>{t('Department.input199')}</Button>
            </Upload>
            <br />
            <Form.Item
                name={[field.name, 'vanban']}
                fieldKey={[field.fieldKey, 'vanban']}
                label={t('Department.input234')}
            >
                <TextArea rows={4} />
            </Form.Item>
        </>
    );
});

export default Option6;
