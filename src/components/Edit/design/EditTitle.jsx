import { Form, Input } from "antd";
import Container from "../../../config/PhieuChecklist/Container";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export function EditTitle({ form, docData, checkTitleDuplicate }) {
  return (
    <Container
      css="niso-box-titles"
      content={
        <>
          <Form.Item
            name="title"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề!' },
              { validator: checkTitleDuplicate }
            ]}
          >
            <Input style={{ fontSize: 24, fontWeight: 'bold' }} />
          </Form.Item>
          <Form.Item name="contentTitle">
            <CKEditor
              editor={ClassicEditor}
              data={docData?.contentTitle || ''}
              onChange={(_, editor) => form.setFieldsValue({ contentTitle: editor.getData() })}
            />
          </Form.Item>
        </>
      }
    />
  );
}