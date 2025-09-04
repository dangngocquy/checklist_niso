import React from 'react';
import { Form } from 'antd';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { CKEditor } from '@ckeditor/ckeditor5-react';

const Option0 = React.memo(({ field, questions, index, setQuestions, form,t }) => {
    return (
        <Form.Item
            name={[field.name, 'noidung']}
            fieldKey={[field.fieldKey, 'noidung']}
            rules={[{ required: true, message: t('Department.input238') }]}
            style={{marginBottom: 0}}
        >
            <CKEditor
                editor={ClassicEditor}
                data={questions[index].noidung || ''}
                config={{
                    placeholder: `${t('Create.input14')}`,
                }}
                onChange={(event, editor) => {
                    const data = editor.getData();
                    setQuestions(prevQuestions => {
                        const newQuestions = [...prevQuestions];
                        newQuestions[index] = {
                            ...newQuestions[index],
                            noidung: data
                        };
                        return newQuestions;
                    });
                    form.setFieldsValue({
                        questions: form.getFieldValue('questions').map((q, i) =>
                            i === index ? { ...q, noidung: data } : q
                        )
                    });
                }}
            />
        </Form.Item>
    );
});

export default Option0;
