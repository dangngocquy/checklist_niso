import React from 'react';
import { Input, Form } from 'antd';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Container from '../../../config/PhieuChecklist/Container';
import { CKEditor } from '@ckeditor/ckeditor5-react';

const Title = React.memo(({ form, totalPoints, t }) => {
  return (
    <Container
      css="niso-box-titles"
      content={
        <>
          <Form.Item
            name="title"
            label={<span><span>{t('Department.input55')}</span></span>}
            rules={[
              { required: true, message: t('Create.input28') }, // Chỉ giữ rule required
            ]}
          >
            <Input placeholder={t('Department.input112')} style={{fontWeight: 'bold'}}/>
          </Form.Item>

          <Form.Item
            name="contentTitle"
            label={t('Department.input225')}
          >
            <CKEditor
              editor={ClassicEditor}
              data={form.getFieldValue('contentTitle') || ''}
              onChange={(event, editor) => {
                const data = editor.getData();
                form.setFieldsValue({
                  contentTitle: data,
                });
                form.setFieldsValue({
                  isEditingContentTitle: true,
                });
              }}
              config={{
                placeholder: `${t('Create.input14')}`,
              }}
              onBlur={() => {
                form.validateFields(['contentTitle']);
                form.setFieldsValue({
                  isEditingContentTitle: false,
                });
              }}
              onFocus={() => {
                form.setFieldsValue({
                  isEditingContentTitle: true,
                });
              }}
            />
          </Form.Item>
        </>
      }
    />
  );
});

export default Title;