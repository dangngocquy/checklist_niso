import { Form, Button, Input } from "antd";

export function EditOptionOne({showModal, index}) {
  return (
    <div>
      <Form.Item>
        <Input.TextArea
          rows={4}
          style={{ borderRadius: 6 }}
          placeholder='Trả lời văn bản'
          disabled
        />
      </Form.Item>
      <Button onClick={() => showModal(index)}>Nhập đáp án</Button>
    </div>
  );
}