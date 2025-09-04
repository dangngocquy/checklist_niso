import React from 'react';
import { Input, Form, Upload, Button } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';

const Option5 = React.memo(({removeImage, index, field, handleImageUpload, questions, t}) => {
    const { TextArea } = Input;
    return (
        <>
            <Upload
                beforeUpload={(file) => {
                    handleImageUpload(file, index);
                    return false;
                }}
                multiple
            >
                <Button icon={<UploadOutlined />}>{t('Department.input235')}</Button>
            </Upload>
            {questions[index]?.hinhanh && (
                <div style={{ marginTop: '16px' }}>
                    {questions[index].hinhanh.map((image, imageIndex) => (
                        <div key={imageIndex} style={{ marginBottom: '8px' }}>
                            <img src={image} alt={`Uploaded ${imageIndex}`} style={{ maxWidth: '100%', maxHeight: '200px' }} />
                            <Button shape='circle' icon={<DeleteOutlined />} onClick={() => removeImage(index, imageIndex)}>Delete</Button>
                        </div>
                    ))}
                </div>
            )}
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

export default Option5;
