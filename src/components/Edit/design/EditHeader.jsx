import { Button, Space, Modal, Tooltip } from "antd";
import { CopyFilled, CloudOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useState } from "react";
import useRelativeTime from "../../../hook/useRelativeTime";

export function EditHeader({ isInDrawer, navigate, handleDuplicate, handleSubmit, docData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const relativeTime = useRelativeTime(docData?.ngaychinhsua || '');

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    handleDuplicate();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={!isInDrawer ? "header__extra__niso" : "header__normal"} style={{ padding: '0 10px' }}>
        <div className={!isInDrawer ? "layout_main_niso" : ""} style={{ margin: "0 auto", maxWidth: "760px", display: "flex", flexWrap: 'wrap', gap: 12, justifyContent: !isInDrawer ? "space-between" : "flex-end" }}>
          <Space direction='horizontal' style={{ justifyContent: isInDrawer ? 'flex-end' : 'space-between', width: '100%' }}>
            {!isInDrawer && (
              <Button htmlType="button" type='default' onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>
                Quay lại
              </Button>
            )}
            <Space>
              <Button type='default' size='middle' icon={<CopyFilled />} onClick={showModal}>
                Nhân bản
              </Button>
              <Button type="primary" onClick={handleSubmit} size='middle' icon={<CloudOutlined />}>
                Cập nhật
              </Button>
            </Space>
          </Space>
          {docData.ngaychinhsua && (
            <div style={{ opacity: 0.5, fontSize: 'smaller', marginBottom: 10 }}>
              Cập nhật lần cuối: 
              <Tooltip title={docData.ngaychinhsua}>
                <span style={{ cursor: 'pointer' }}> {relativeTime}</span>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Xác nhận nhân bản"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Đồng ý"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn nhân bản mục này không?</p>
      </Modal>
    </>
  );
}