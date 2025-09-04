import React, { useEffect, useRef, useState } from 'react';
import { Form, Spin } from 'antd';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export const EditOptionZero = ({ form, index, question, visibleQuestions, debouncedCKEditorChange }) => {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    const content = form.getFieldValue(['questions', index, 'noidung']) || question.noidung || '';
    setEditorContent(content);
  }, [form, index, question]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
      }
    };
  }, []);

  const handleEditorReady = (editor) => {
    try {
      editorRef.current = editor;
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing editor:', error);
    }
  };

  const handleEditorChange = (_, editor) => {
    try {
      if (editor && editor.getData) {
        const data = editor.getData();
        setEditorContent(data);
        debouncedCKEditorChange(index, data, 'noidung');
      }
    } catch (error) {
      console.error('Error updating editor content:', error);
    }
  };

  if (!visibleQuestions[index]) {
    return <div style={{ height: 100 }} />;
  }

  return (
    <Form.Item name={['questions', index, 'noidung']}>
      <div style={{ minHeight: '100%' }}>
        {isLoading && <Spin size='small'/>}
        <CKEditor
          editor={ClassicEditor}
          data={editorContent}
          onReady={handleEditorReady}
          onChange={handleEditorChange}
          config={{
            removePlugins: ['Title'],
            toolbar: {
              items: [
                'heading',
                '|',
                'bold',
                'italic',
                'link',
                'bulletedList',
                'numberedList',
                '|',
                'outdent',
                'indent',
                '|',
                'blockQuote',
                'insertTable',
                'undo',
                'redo'
              ],
              shouldNotGroupWhenFull: true
            },
            placeholder: 'Nhập nội dung...'
          }}
        />
      </div>
    </Form.Item>
  );
};