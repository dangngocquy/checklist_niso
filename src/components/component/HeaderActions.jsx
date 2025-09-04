import React, { useState } from 'react';
import { Button, Space, Modal, message } from 'antd';
import { CopyOutlined, RollbackOutlined } from '@ant-design/icons';
import moment from 'moment';
import useApi from '../../hook/useApi';

const HeaderActions = ({ navigate, docData, user, form, finalId, isInDrawer = false, handleSubmit }) => {
  const [isDuplicateModalVisible, setIsDuplicateModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false); // Loading riêng cho duplicate
  const [updateLoading, setUpdateLoading] = useState(false);      // Loading riêng cho update
  const { fetchAllChecklists, createChecklist, updateChecklist } = useApi();

  const duplicateDocument = async () => {
    setDuplicateLoading(true); // Bật loading cho duplicate
    try {
      const response = await fetchAllChecklists();
      const allDocuments = response?.data || [];

      if (!Array.isArray(allDocuments)) {
        throw new Error('Dữ liệu trả về từ API không phải là mảng');
      }

      let baseTitle = docData.title.replace(/ \(Copy( \d+)?\)$/, '');
      let maxCopyNumber = 0;
      const copyRegex = new RegExp(`^${baseTitle} \\(Copy( (\\d+))?\\)$`);

      allDocuments.forEach(doc => {
        const match = doc.title.match(copyRegex);
        if (match) {
          const copyNumber = match[2] ? parseInt(match[2]) : 1;
          maxCopyNumber = Math.max(maxCopyNumber, copyNumber);
        }
      });

      const newTitle = maxCopyNumber === 0 ? `${baseTitle} (Copy)` : `${baseTitle} (Copy ${maxCopyNumber + 1})`;
      const duplicatedData = JSON.parse(JSON.stringify(docData));
      duplicatedData.title = newTitle;
      duplicatedData.date = moment().format('DD-MM-YYYY HH:mm:ss');
      delete duplicatedData.id;
      duplicatedData.userKeys = user.keys;

      await createChecklist(duplicatedData);
      setIsDuplicateModalVisible(false);
    } catch (error) {
      console.error('Error duplicating document:', error);
    } finally {
      setDuplicateLoading(false); // Tắt loading cho duplicate
    }
  };

  const handleUpdate = () => {
    setUpdateLoading(true); // Bật loading cho update
    form
      .validateFields()
      .then(values => {
        onFinish(values);
      })
      .catch(error => {
        console.error('Validation failed:', error);
        setUpdateLoading(false);
      });
  };

  const onFinish = async (values) => {
    try {
      const currentDateTime = moment().format('DD/MM/YYYY HH:mm:ss');
      const existingNgayChinhSua = Array.isArray(docData.ngaychinhsua) ? [...docData.ngaychinhsua] : [];
      const updatedNgayChinhSua = [...existingNgayChinhSua, currentDateTime];

      const updatedData = {
        ...values,
        date: moment().format('DD-MM-YYYY HH:mm:ss'),
        account: `${user.name} - ( ${user.bophan} )`,
        ngaychinhsua: updatedNgayChinhSua,
      };

      await updateChecklist(finalId, updatedData);
      message.success("Cập nhật checklist thành công.");
      setIsUpdateModalVisible(false);
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className={!isInDrawer ? "header__extra__niso" : "header__normal"} style={{ padding: '0 10px' }}>
       <div className={!isInDrawer ? "layout_main_niso" : ""} style={{ margin: "0 auto", maxWidth: "760px", paddingBottom: 12, display: "flex", flexWrap: 'wrap', gap: 12, justifyContent: !isInDrawer ? "space-between" : "flex-end" }}>
        {!isInDrawer && <Button onClick={() => navigate("/auth/docs/list/danh-sach-check-list")} icon={<RollbackOutlined />}>Quay lại</Button>}
        <Space>
          <Button
            icon={<CopyOutlined />}
            onClick={handleSubmit}
            loading={duplicateLoading} // Sử dụng loading riêng cho duplicate
          >
            Nhân bản
          </Button>
          <Button
            type="primary"
            onClick={() => setIsUpdateModalVisible(true)}
            loading={updateLoading} // Sử dụng loading riêng cho update
          >
            Cập nhật
          </Button>
        </Space>

        <Modal
          title="Xác nhận nhân bản"
          visible={isDuplicateModalVisible}
          onOk={duplicateDocument}
          onCancel={() => setIsDuplicateModalVisible(false)}
          confirmLoading={duplicateLoading} // Sử dụng loading riêng cho modal duplicate
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <p>Bạn có chắc chắn muốn nhân bản tài liệu này không?</p>
        </Modal>

        <Modal
          title="Xác nhận cập nhật"
          visible={isUpdateModalVisible}
          onOk={handleUpdate}
          onCancel={() => setIsUpdateModalVisible(false)}
          confirmLoading={updateLoading} // Sử dụng loading riêng cho modal update
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <p>Bạn có chắc chắn muốn lưu các thay đổi cho tài liệu này không?</p>
        </Modal>
      </div>
    </div>
  );
};

export default HeaderActions;