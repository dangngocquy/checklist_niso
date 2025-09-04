import { Form, Button, Space, Select, Switch, InputNumber, Divider } from 'antd';
import { PlusOutlined, UpOutlined, DownOutlined, DeleteOutlined } from '@ant-design/icons';
import Container from '../../../config/PhieuChecklist/Container';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const { Option } = Select;
export const EditMain = ({ t, question, index, docData, form, renderContent, showSubtitleContainer, deleteQuestion, moveQuestion, setShowSubtitleContainer, toggleShowRequirement, showRequirement }) => {
    return (
        <Container
            key={index}
            content={
                <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ marginBottom: 15, justifyContent: 'space-between', width: '100%' }} wrap>
                        {docData?.demcauhoi && <span>Câu hỏi {index + 1}.</span>}
                        <Space wrap>
                            <Button
                                type="dashed"
                                onClick={() => {
                                    form.setFieldsValue({
                                        questions: {
                                            [index]: {
                                                subtitle: { tieudephieuthem: '', noidungphieuthem: '' }
                                            }
                                        }
                                    });
                                    setShowSubtitleContainer(prev => ({ ...prev, [index]: true }));
                                }}
                                icon={<PlusOutlined />}
                                disabled={showSubtitleContainer[index]}
                            >
                                Thêm tiêu đề phụ
                            </Button>
                            <Button onClick={() => toggleShowRequirement(index)}>
                                {showRequirement[index] ? 'Ẩn yêu cầu câu hỏi' : 'Thêm yêu cầu câu hỏi'}
                            </Button>
                            <Form.Item name={['questions', index, 'luachon']} style={{ marginBottom: 0 }}>
                                <Select style={{ width: 200 }} onChange={(value) => {
                                    if (value === 'option0') {
                                        form.setFieldsValue({
                                            questions: {
                                                [index]: {
                                                    cauhoibatbuoc: false
                                                }
                                            }
                                        });
                                    }
                                }}>
                                    <Option value="option0">{t('Create.input9') || 'Văn bản ngắn'}</Option>
                                    <Option value="option1">{t('Create.input10') || 'Văn bản dài'}</Option>
                                    <Option value="option2">{t('Create.input11') || 'Trắc nghiệm'}</Option>
                                    <Option value="option3">{t('Create.input12') || 'Hộp kiểm'}</Option>
                                    <Option value="option4">{t('Create.input13') || 'Đánh giá'}</Option>
                                </Select>
                            </Form.Item>
                        </Space>
                        <Space>
                            <Form.Item name={['questions', index, 'point']} style={{ marginBottom: 0 }}>
                                <InputNumber min={0} placeholder="Điểm" />
                            </Form.Item>
                            <p>điểm</p>
                        </Space>
                    </Space>
                    <Form.Item
                        name={['questions', index, `Cauhoi${index + 1}`]}
                        style={{ marginBottom: 15 }}
                        rules={[{ required: true, message: 'Vui lòng nhập câu hỏi!' }]}
                    >
                        <CKEditor
                            editor={ClassicEditor}
                            data={form.getFieldValue(['questions', index, `Cauhoi${index + 1}`]) || question[`Cauhoi${index + 1}`] || ''}
                            onChange={(_, editor) => form.setFieldsValue({ questions: { [index]: { [`Cauhoi${index + 1}`]: editor.getData() } } })}
                        />
                    </Form.Item>
                    {showRequirement[index] && (
                        <Form.Item name={['questions', index, 'yeu_cau']}>
                            <CKEditor
                                editor={ClassicEditor}
                                data={question.yeu_cau || ''}
                                onChange={(_, editor) => form.setFieldsValue({ questions: { [index]: { yeu_cau: editor.getData() } } })}
                            />
                        </Form.Item>
                    )}
                    {renderContent()}
                    <Divider />
                    <Space direction="horizontal" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Space>
                            {form.getFieldValue(['questions', index, 'luachon']) !== 'option0' && (
                                <Form.Item name={['questions', index, 'cauhoibatbuoc']} valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Switch checkedChildren='Câu hỏi bắt buộc (Đang bật)' unCheckedChildren='Câu hỏi bắt buộc (Đã tắt)' />
                                </Form.Item>
                            )}
                            <Form.Item name={['questions', index, 'batxuly']} valuePropName="checked" style={{ marginBottom: 0 }}>
                                <Switch checkedChildren='Đang hiện nút nhận xử lý (sau phản hồi)' unCheckedChildren='Đã ẩn nút nhận xử lý (sau phản hồi)' />
                            </Form.Item>
                        </Space>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                onClick={() => moveQuestion(index, index - 1)}
                                disabled={index === 0}
                                icon={<UpOutlined />}
                                shape='circle'
                            />
                            <Button
                                shape='circle'
                                onClick={() => moveQuestion(index, index + 1)}
                                disabled={index === docData.questions.length - 1}
                                icon={<DownOutlined />}
                            />
                            <Button
                                shape='circle'
                                onClick={() => deleteQuestion(index)}
                                icon={<DeleteOutlined />}
                                danger
                                disabled={docData.questions.length === 1}
                            />
                        </div>
                    </Space>
                </Form.Item>
            }
        />
    );
};