import React from 'react';
import { Input, Form } from 'antd';

const Option1 = React.memo(() => {
    const { TextArea } = Input;
    return (
        <Form.Item
        style={{marginBottom: 0}}
        >
            <TextArea autoSize={{
                minRows: 4,
                maxRows: 5,
            }} disabled />
        </Form.Item>
    );
});

export default Option1;
