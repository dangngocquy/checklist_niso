import { Form, Button, Space, Select, Rate } from "antd";
import { StarOutlined, HeartOutlined, CheckOutlined, FieldBinaryOutlined } from "@ant-design/icons";

const { Option } = Select;

export function EditOptionFour({ index, activeButtons, handleButtonClick, form }) {
  const selectedIcon = form.getFieldValue(['questions', index, 'luachonbieutuong']) || 'ngoisao';
  const currentPlusNumber = form.getFieldValue(['questions', index, 'plusnumber']) || 5;
  return (
    <>
      <Space wrap style={{ marginBottom: 15 }}>
        <Form.Item name={['questions', index, 'luachonbieutuong']} style={{ marginBottom: 0 }}>
          <Select style={{ width: 150 }}>
            <Option value="ngoisao">Ngôi sao <StarOutlined /></Option>
            <Option value="traitim">Trái tim <HeartOutlined /></Option>
            <Option value="daukiem">Dấu kiểm <CheckOutlined /></Option>
            <Option value="so">Số <FieldBinaryOutlined /></Option>
          </Select>
        </Form.Item>
        <Form.Item name={['questions', index, 'plusnumber']} style={{ marginBottom: 0 }}>
          <Select style={{ width: 120 }}>
            {[...Array(10)].map((_, i) => (
              <Option key={i} value={i + 1}>{i + 1}</Option>
            ))}
          </Select>
        </Form.Item>
      </Space>
      <Form.Item name={['questions', index, 'cautraloi']}>
        <Rate
          count={currentPlusNumber}
          value={activeButtons[index] || 0}
          disabled
          character={({ index: buttonIndex }) => {
            const isActive = (activeButtons[index] || 0) >= buttonIndex + 1;
            const style = { backgroundColor: isActive ? '#ae8f3d' : 'white', color: isActive ? 'white' : 'black' };
            if (selectedIcon === 'ngoisao') return <Button size='large' shape='circle' icon={<StarOutlined />} style={style} />;
            if (selectedIcon === 'traitim') return <Button size='large' shape='circle' icon={<HeartOutlined />} style={style} />;
            if (selectedIcon === 'daukiem') return <Button size='large' shape='circle' icon={<CheckOutlined />} style={style} />;
            if (selectedIcon === 'so') return <Button size='large' shape='circle' style={style}>{buttonIndex + 1}</Button>;
            return <Button size='large' shape='circle' icon={<StarOutlined />} style={style} />;
          }}
          onChange={(value) => handleButtonClick(index, value)}
        />
      </Form.Item>
    </>
  );
}