import { Form, Input, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import Container from '../../../config/PhieuChecklist/Container';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useCallback, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';

export const EditTieuDePhu = ({ form, index, subtitle, setShowSubtitleContainer, setDocData }) => {
  const [editorData, setEditorData] = useState(subtitle?.noidungphieuthem || '');

  const debouncedCKEditorChange = useMemo(() => debounce((data) => {
    try {
      setEditorData(data);
      form.setFieldsValue({
        questions: {
          [index]: {
            subtitle: {
              ...form.getFieldValue(['questions', index, 'subtitle']),
              noidungphieuthem: data
            }
          }
        }
      });
    } catch (error) {
      console.error('Error updating CKEditor field:', error);
    }
  }, 300), [form, index]);

  const handleDelete = useCallback(() => {
    setShowSubtitleContainer(prev => ({ ...prev, [index]: false }));
    setDocData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = {
        ...newQuestions[index],
        subtitle: { tieudephieuthem: '', noidungphieuthem: '' }
      };
      return { ...prev, questions: newQuestions };
    });
  }, [index, setShowSubtitleContainer, setDocData]);

  const handleEditorReady = useCallback((editor) => {
    // Đảm bảo editor đã được khởi tạo
    if (editor) {
      editor.setData(editorData);
    }
  }, [editorData]);

  return (
    <Container
      css="border-left-niso"
      content={
        <div style={{ width: '100%' }}>
          <Form.Item
            name={['questions', index, 'subtitle', 'tieudephieuthem']}
            initialValue={subtitle?.tieudephieuthem || ''}
          >
            <Input
              placeholder="Tiêu đề phụ"
              style={{ fontSize: 16, fontWeight: 'bold' }}
              onChange={(e) => {
                form.setFieldsValue({
                  questions: {
                    [index]: {
                      subtitle: {
                        ...form.getFieldValue(['questions', index, 'subtitle']),
                        tieudephieuthem: e.target.value
                      }
                    }
                  }
                });
              }}
            />
          </Form.Item>
          <Form.Item
            name={['questions', index, 'subtitle', 'noidungphieuthem']}
            initialValue={subtitle?.noidungphieuthem || ''}
            validateTrigger={['onChange', 'onBlur']}
          >
            <CKEditor
              editor={ClassicEditor}
              data={editorData}
              onReady={handleEditorReady}
              onChange={(_, editor) => {
                const data = editor.getData();
                debouncedCKEditorChange(data);
              }}
              config={{
                toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList'],
                placeholder: 'Nhập nội dung phụ...'
              }}
            />
          </Form.Item>
          <Button
            type="dashed"
            icon={<DeleteOutlined />}
            danger
            style={{ marginTop: 16 }}
            onClick={handleDelete}
          >
            Xóa tiêu đề phụ
          </Button>
        </div>
      }
    />
  );
};