import React, { useState, useEffect, useMemo } from "react";
import { debounce } from "lodash";
import useApi from "../../../hook/useApi";
import useSearch from "../../../hook/SearchAccount/useSearch";
import useSearchDepartment from "../../../hook/SearchDepartment/useSearchDepartment";
import useSearchShop from "../../../hook/SearchShop/useSearchShop";
import axios from "axios";
import {
    Drawer,
    Form,
    Button,
    Input,
    Col,
    Row,
    Select,
    Table,
    Space,
    Switch,
    message,
    Popconfirm,
    notification,
    Avatar,
    Tag,
    Alert,
    Upload,
    Tooltip,
    Spin,
    Empty,
    Modal,
    Progress,
    Card,
    Typography,
    DatePicker,
} from "antd";
import {
    DownloadOutlined, RightOutlined, InboxOutlined, UploadOutlined, EyeOutlined, EyeInvisibleOutlined, EditOutlined, DeleteOutlined,
    UserOutlined,
    LockOutlined,
    IdcardOutlined,
    ApartmentOutlined,
    ShopOutlined,
    KeyOutlined,
    InfoCircleOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import NotFoundPage from "../../NotFoundPage";
import moment from "moment";
import Avatars from "../../../config/design/Avatars";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";

const { Option } = Select;
const { Text } = Typography;
const { RangePicker } = DatePicker;

const Account = ({ user, t }) => {
    const {
        addUser,
        updateUser,
        deleteUser,
        deleteMultipleUsers,
        searchShop,
    } = useApi();

    const { loading: loadingUsers, options: userOptions, searchUsers } = useSearch();
    const { loading: loadingDepartments, options: departmentOptions, searchDepartments } = useSearchDepartment();
    const { loading: loadingShops, options: shopOptions, searchShops } = useSearchShop(searchShop);

    const [users, setUsers] = useState([]);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();
    const [editUser, setEditUser] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const currentDate = moment().format("DD-MM-YYYY HH:mm:ss");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchName, setSearchName] = useState(null);
    const [searchBophan, setSearchBophan] = useState(null);
    const [searchChinhanh, setSearchChinhanh] = useState(null);
    const [searchLocker, setSearchLocker] = useState(null);
    const [pageSize, setPageSize] = useState(5);
    const [selectedUsers, setSelectedUsers] = useState({});
    const [tableLoading, setTableLoading] = useState(false);
    const [passwordVisibility, setPasswordVisibility] = useState({});
    const [saveLoading, setSaveLoading] = useState(false);
    const [dateRange, setDateRange] = useState(null);

    const showDrawer = () => setVisible(true);
    const onClose = () => {
        setVisible(false);
        setEditUser(null);
        form.resetFields();
    };

    
    const fetchData = useMemo(
        () => debounce((page, forceRefresh) => {
            setTableLoading(true);
            const params = {
                page,
                limit: pageSize,
                name: searchName || undefined,
                bophan: searchBophan || undefined,
                chinhanh: searchChinhanh || undefined,
                locker: searchLocker === null ? undefined : searchLocker.toString(),
                startDate: dateRange?.[0]?.format('DD-MM-YYYY HH:mm:ss'),
                endDate: dateRange?.[1]?.format('DD-MM-YYYY HH:mm:ss'),
            };

            console.log('Fetching with params:', params);

            axios.get('/users/all', { 
                params,
                headers: { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
            })
                .then(response => {
                    if (response.data.success) {
                        // Sắp xếp dữ liệu theo thời gian mới nhất
                        const sortedData = response.data.data.map(item => {
                            let formattedDate = null;
                            try {
                                if (item.date) {
                                    // Kiểm tra nếu date đã ở định dạng DD-MM-YYYY HH:mm:ss
                                    if (moment(item.date, 'DD-MM-YYYY HH:mm:ss', true).isValid()) {
                                        formattedDate = item.date;
                                    } else {
                                        // Nếu là ISO string, chuyển đổi sang định dạng mong muốn
                                        formattedDate = moment(item.date).format('DD-MM-YYYY HH:mm:ss');
                                    }
                                }
                            } catch (error) {
                                console.error('Error formatting date:', error);
                                formattedDate = null;
                            }
                            return {
                                ...item,
                                date: formattedDate
                            };
                        }).sort((a, b) => {
                            if (!a.date) return 1;
                            if (!b.date) return -1;
                            return moment(b.date, 'DD-MM-YYYY HH:mm:ss').valueOf() - moment(a.date, 'DD-MM-YYYY HH:mm:ss').valueOf();
                        });

                        setUsers(sortedData);
                        setTotalItems(response.data.total);
                        setCurrentPage(page);
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    message.error('Lỗi khi tải dữ liệu');
                })
                .finally(() => {
                    setTableLoading(false);
                });
        }, 300),
        [pageSize, searchName, searchBophan, searchChinhanh, searchLocker, dateRange]
    );

    useEffect(() => {
        fetchData(1);
        return () => {
            fetchData.cancel();
        };
    }, [fetchData]);

    const handlePageChange = (page, newPageSize) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) setPageSize(newPageSize);
        fetchData(page);
    };

    const onFinish = async (values) => {
        try {
            setSaveLoading(true);
            if (editUser) {
                const updatedData = {
                    ...values,
                    locker: !!values.locker,
                    imgAvatar: editUser.imgAvatar,
                    keys: editUser.keys,
                    userKeys: user.keys,
                };
                const hasChanges = Object.keys(values).some(
                    (key) => values[key] !== editUser[key] && values[key] !== undefined
                );

                if (!hasChanges) {
                    message.info("Không có thay đổi nào để cập nhật.");
                    onClose();
                    return;
                }
                console.log("Sending update request:", updatedData);

                await updateUser(editUser.keys, updatedData).catch((err) => {
                    console.error("API Error:", err.response?.data || err.message);
                    throw err;
                });

                // Cập nhật state users ngay lập tức nếu thành công
                setUsers((prevUsers) =>
                    prevUsers.map((u) => (u.keys === editUser.keys ? { ...u, ...updatedData } : u))
                );
                message.success(t("Report.input20")); // Thông báo thành công
            } else {
                // Thêm người dùng mới
                const newUser = {
                    ...values,
                    locker: !!values.locker, // Chuyển đổi sang boolean
                    date: currentDate,
                    keys: uuidv4(),
                    userKeys: user.keys
                };

                // Gửi yêu cầu thêm user
                await addUser(newUser);

                // Thêm user mới vào đầu danh sách và kiểm tra phân trang
                setUsers((prevUsers) => {
                    const newUsers = [newUser, ...prevUsers];
                    if (newUsers.length > pageSize) {
                        newUsers.pop(); // Loại bỏ phần tử cuối nếu vượt quá pageSize
                    }
                    return newUsers;
                });
                setTotalItems((prev) => prev + 1);
                message.success(t("Report.input20")); // Thông báo thành công
            }
            onClose(); // Đóng drawer sau khi hoàn tất
        } catch (error) {
            console.error("Lỗi trong onFinish:", error);
            message.error("Vui lòng thử lại sau.");
            fetchData(currentPage, true); // Fetch lại dữ liệu nếu có lỗi
        } finally {
            setSaveLoading(false);
        }
    };


    const deleteUserHandler = async (keys) => {
        try {
            // Thực hiện xóa trên MongoDB
            await deleteUser(keys, { userKeys: user.keys });

            // Cập nhật state users ngay lập tức
            const newUsers = users.filter((u) => u.keys !== keys);
            const newTotalItems = totalItems - 1;
            setTotalItems(newTotalItems);

            // Nếu số lượng items trong trang hiện tại < pageSize và còn dữ liệu ở trang sau
            if (newUsers.length < pageSize && currentPage < Math.ceil(newTotalItems / pageSize)) {
                try {
                    // Lấy thêm dữ liệu từ trang tiếp theo
                    const nextPageData = await axios.get('/users/all', {
                        params: {
                            page: currentPage + 1,
                            limit: pageSize,
                            name: searchName || undefined,
                            bophan: searchBophan || undefined,
                            chinhanh: searchChinhanh || undefined,
                            locker: searchLocker === null ? undefined : searchLocker.toString(),
                        },
                        headers: { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
                    });

                    if (nextPageData.data && nextPageData.data.success) {
                        // Lấy số lượng items cần thiết để bù vào trang hiện tại
                        const itemsNeeded = pageSize - newUsers.length;
                        const additionalItems = nextPageData.data.data.slice(0, itemsNeeded);
                        
                        // Cập nhật state với dữ liệu mới
                        setUsers([...newUsers, ...additionalItems]);
                    }
                } catch (error) {
                    console.error('Error fetching next page data:', error);
                    // Nếu có lỗi khi lấy dữ liệu trang tiếp theo, vẫn cập nhật state hiện tại
                    setUsers(newUsers);
                }
            } else {
                // Nếu không cần lấy thêm dữ liệu, chỉ cập nhật state hiện tại
                setUsers(newUsers);
            }

            message.success('Xóa tài khoản thành công.');
        } catch (error) {
            console.error("Error deleting user:", error);
            message.error("Xóa tài khoản thất bại!");
            fetchData(currentPage, true); // Fetch lại nếu lỗi
        }
    };

    const handleSelectionChange = (selectedRowKeys, selectedRows) => {
        setSelectedRowKeys(selectedRowKeys);
        const newSelectedUsers = {};
        selectedRows.forEach((row) => {
            newSelectedUsers[row.keys] = row;
        });
        setSelectedUsers(newSelectedUsers);
    };

    const deleteSelectedUsers = async () => {
        try {
            const keysToDelete = Object.keys(selectedUsers);
            if (keysToDelete.length === 0) {
                message.warning('Vui lòng chọn ít nhất một tài khoản để xóa.');
                return;
            }

            const response = await deleteMultipleUsers(keysToDelete, user.keys);
            if (response.success) {
                // Cập nhật state users ngay lập tức
                const newUsers = users.filter((u) => !keysToDelete.includes(u.keys));
                const newTotalItems = totalItems - response.deletedCount;
                setTotalItems(newTotalItems);

                // Tạo thông báo
                const deletedUsers = Object.values(selectedUsers);
                let deleteMessage = "";
                if (response.deletedCount <= 3) {
                    deleteMessage = `Xóa tài khoản: ${deletedUsers.map(u => u.name).join(", ")}`;
                } else {
                    const firstThree = deletedUsers.slice(0, 3).map(u => u.name).join(", ");
                    const remainingCount = response.deletedCount - 3;
                    deleteMessage = `Đã xóa ${firstThree}, và ${remainingCount} tài khoản khác`;
                }

                notification.success({
                    message: "Thành công",
                    description: deleteMessage,
                    showProgress: true,
                    pauseOnHover: true,
                });

                // Kiểm tra và điều chỉnh trang nếu cần
                const totalPagesAfterDelete = Math.ceil(newTotalItems / pageSize);
                let newCurrentPage = Math.min(currentPage, totalPagesAfterDelete) || 1;

                // Nếu trang hiện tại không đủ 5 mục và còn dữ liệu ở trang sau, fetch thêm
                if (newUsers.length < pageSize && newCurrentPage < totalPagesAfterDelete && newTotalItems > 0) {
                    try {
                        const nextPageData = await axios.get('/users/all', {
                            params: {
                                page: newCurrentPage + 1,
                                limit: pageSize,
                                name: searchName || undefined,
                                bophan: searchBophan || undefined,
                                chinhanh: searchChinhanh || undefined,
                                locker: searchLocker === null ? undefined : searchLocker.toString(),
                            },
                            headers: { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
                        });
                        if (nextPageData.data && nextPageData.data.success) {
                            // Kết hợp dữ liệu từ trang hiện tại và trang tiếp theo
                            const additionalUsers = nextPageData.data.data.slice(0, pageSize - newUsers.length);
                            setUsers([...newUsers, ...additionalUsers]);
                        }
                    } catch (error) {
                        console.error('Error fetching next page data:', error);
                        // Nếu có lỗi khi lấy dữ liệu trang tiếp theo, vẫn cập nhật state hiện tại
                        setUsers(newUsers);
                    }
                } else if (newUsers.length === 0 && newCurrentPage < currentPage) {
                    // Nếu trang hiện tại trống, chuyển về trang trước
                    newCurrentPage = Math.max(1, newCurrentPage);
                    setCurrentPage(newCurrentPage);
                    fetchData(newCurrentPage, true);
                }

                setCurrentPage(newCurrentPage);
            } else {
                message.error('Xóa tài khoản thất bại.');
                fetchData(currentPage, true);
            }

            setSelectedRowKeys([]);
            setSelectedUsers({});
        } catch (error) {
            console.error("Unexpected error:", error);
            message.error("Đã xảy ra lỗi không mong muốn.");
            fetchData(currentPage, true);
        }
    };
    const showEditDrawer = (record) => {
        setEditUser(record);
        setVisible(true);
        form.setFieldsValue({
            name: record.name,
            username: record.username,
            password: record.password,
            phanquyen: record.phanquyen,
            chinhanh: record.chinhanh,
            chucvu: record.chucvu,
            bophan: record.bophan,
            code_staff: record.code_staff || null,
            locker: record.locker,
        });
    };

    const handleDownload = () => {
        if (!users || users.length === 0) {
            notification.warning({
                message: "Cảnh báo",
                description: "Không có dữ liệu để tải xuống!",
                showProgress: true,
                pauseOnHover: true,
            });
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(users);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        XLSX.writeFile(workbook, "Account_List.xlsx");
        message.success(t("Department.input340"));
    };
    const handleUpload = async ({ file, onSuccess, onError, onProgress }) => {
        try {
            setUploading(true);
            setUploadProgress(0);

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    // Kiểm tra xem json có phải là mảng không
                    if (!Array.isArray(json)) {
                        throw new Error("Dữ liệu từ file Excel không hợp lệ, không phải mảng");
                    }
                    console.log("Dữ liệu từ Excel:", json);

                    const records = json.map((newUser) => ({
                        ...newUser,
                        keys: newUser.keys || uuidv4(),
                        date: newUser.date || currentDate,
                        userKeys: user.keys,
                    }));

                    console.log("Records gửi lên backend:", records);

                    // Gửi toàn bộ dữ liệu lên backend
                    const response = await axios.post(
                        "/users/add",
                        {
                            batchUpload: true,
                            records,
                            userKeys: user.keys,
                        },
                        { headers: { Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` } }
                    );

                    const { processedRecords, skippedRecords } = response.data;

                    setUsers((prevUsers) => [...processedRecords, ...prevUsers]);
                    setTotalItems((prev) => prev + processedRecords.length);

                    if (skippedRecords > 0) {
                        notification.warning({
                            message: "Cảnh báo",
                            description: `Đã bỏ qua ${skippedRecords} tài khoản do trùng token hoặc username`,
                            showProgress: true,
                            pauseOnHover: true,
                        });
                    }

                    onSuccess();
                } catch (error) {
                    console.error("Lỗi trong quá trình xử lý file:", error);
                    onError(error);
                    message.error(t("Department.input342"));
                    fetchData(currentPage, true);
                } finally {
                    setUploading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Lỗi ngoài cùng trong handleUpload:", error);
            onError(error);
            setUploading(false);
            message.error("Tải file thất bại.");
        }
    };

    const columns = [
        {
            title: t("Input.input7"),
            dataIndex: "stt",
            key: "stt",
            render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: t("Department.input254"),
            dataIndex: "imgAvatar",
            key: "imgAvatar",
            render: (imgAvatar, record) => (
                <Tooltip title={record.name}>
                    <span>
                        {imgAvatar && imgAvatar !== "null" ? (
                            <Spin spinning={!imgAvatar}>
                                <Avatar src={imgAvatar} size="large" />
                            </Spin>
                        ) : (
                            <Avatars user={record} sizeImg="large" />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: t("Department.input343"),
            dataIndex: "name",
            key: "name",
            render: (name) => <Tag color="purple" bordered={false}>{name}</Tag>,
        },
        {
            title: t("Department.input346"),
            dataIndex: "chucvu",
            key: "chucvu",
            render: (record) => (record === null || record === undefined || record === "" ? <Tag color="red" bordered={false}>Trống</Tag> : record),
        },
        {
            title: t("Header.header3"),
            dataIndex: "bophan",
            key: "bophan",
            render: (bophan) =>
                bophan && typeof bophan === "string" ? (
                    bophan.toUpperCase()
                ) : (
                    <Tag color="red" bordered={false}>Trống</Tag>
                ),
        },
        {
            title: t("Department.input257"),
            dataIndex: "chinhanh",
            key: "chinhanh",
            render: (chinhanh) =>
                chinhanh && typeof chinhanh === "string" ? (
                    <Tag color="blue" bordered={false}>{chinhanh.toUpperCase()}</Tag>
                ) : (
                    <Tag color="red" bordered={false}>Trống</Tag>
                ),
        },
        {
            title: t("Department.input344"),
            dataIndex: "username",
            key: "username",
            render: (username) => username ? <Tag color="blue" bordered={false}>{username}</Tag> : <Tag color="red" bordered={false}>Trống</Tag>
        },
        {
            title: t("Department.input345"),
            dataIndex: "code_staff",
            key: "code_staff",
            render: (record) =>
                record === null || record === undefined || record === "" ? (
                    <Tag color="red" bordered={false}>Trống</Tag>
                ) : (
                    record
                ),
        },
        {
            title: t("Report.input28"),
            dataIndex: "password",
            key: "password",
            render: (text, record) => (
                <Space>
                    {passwordVisibility[record.keys] ? text : '••••••••'}
                    <Button
                        type="text"
                        icon={passwordVisibility[record.keys] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        onClick={() => {
                            setPasswordVisibility(prev => ({
                                ...prev,
                                [record.keys]: !prev[record.keys]
                            }));
                        }}
                    />
                </Space>
            )
        },
        {
            title: t("Menu.menu4"),
            dataIndex: "phanquyen",
            key: "phanquyen",
            render: (phanquyen) => {
                let color, text;
                if (phanquyen === true) {
                    color = "red";
                    text = "Administrator";
                } else if (phanquyen === false) {
                    color = "green";
                    text = "User";
                } else if (phanquyen === "Xử lý yêu cầu") {
                    color = "blue";
                    text = "Request Management";
                } else if (phanquyen === "IT asset") {
                    color = "yellow";
                    text = "IT Asset Management";
                } else {
                    color = "gray";
                    text = "Không xác định";
                }
                return <Tag color={color} bordered={false}>{text}</Tag>;
            },
        },
        {
            title: t("Report.input29"),
            dataIndex: "locker",
            key: "locker",
            render: (locker) => {
                let color = locker ? "red" : "green";
                let text = locker ? "Tạm khóa" : "Đang hoạt động";
                return <Tag color={color} bordered={false}>{text}</Tag>;
            },
        },
        {
            title: t("Department.input348"),
            dataIndex: "date",
            key: "date",
            render: (record) =>
                record === null ? (
                    <Tag color="red" bordered={false}>{t("Department.input349")}</Tag>
                ) : (
                    record
                ),
        },
        {
            title: "Số lần đăng nhập",
            dataIndex: "loginCount",
            key: "loginCount",
            render: (loginCount) => loginCount ? <Tag color="blue" bordered={false}>{loginCount}</Tag> : <Tag color="red" bordered={false}>Chưa ghi nhận</Tag>
        },
        {
            title: t("Department.input244"),
            key: "action",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button type="default" shape='circle' onClick={() => showEditDrawer(record)} icon={<EditOutlined />}>
                        </Button>
                    </Tooltip>
                    <Popconfirm
                        title={t("Department.input350")}
                        onConfirm={() => deleteUserHandler(record.keys)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Xóa">
                            <Button type="default" shape='circle' danger icon={<DeleteOutlined />}>
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleNameChange = (value) => {
        setSearchName(value || null);
        setCurrentPage(1);
        fetchData(1);
    };

    const handleBophanChange = (value) => {
        setSearchBophan(value || null);
        setCurrentPage(1);
        fetchData(1);
    };

    const handleChinhanhChange = (value) => {
        setSearchChinhanh(value || null);
        setCurrentPage(1);
        fetchData(1);
    };

    const handleLockerChange = (value) => {
        setSearchLocker(value === undefined ? null : value);
        setCurrentPage(1);
        fetchData(1);
    };

    const handleDateRangeChange = (dates) => {
        console.log('Selected dates:', dates);
        setDateRange(dates);
        setCurrentPage(1);
        fetchData(1);
    };

    if (user.phanquyen === false) return <NotFoundPage t={t} />;

    return (
        <div className="layout_main_niso">
            <title>NISO CHECKLIST | {t("Department.input182")}</title>

            <Card bordered={false}>
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: handleSelectionChange,
                        preserveSelectedRowKeys: true,
                    }}
                    size="middle"
                    title={() => (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    marginBottom: 12,
                                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                                }}
                            >
                                <Select
                                    showSearch
                                    placeholder={t("Department.input343")}
                                    style={{ width: "100%" }}
                                    onChange={handleNameChange}
                                    value={searchName || undefined}
                                    onSearch={(value) => value && searchUsers(value, "account")}
                                    loading={loadingUsers}
                                    filterOption={false}
                                    notFoundContent={
                                        loadingUsers ? (
                                            <Space>
                                                <Spin size="small" />
                                                <span>Loading...</span>
                                            </Space>
                                        ) : (
                                            null
                                        )
                                    }
                                    allowClear
                                    disabled={tableLoading}
                                >
                                    {userOptions.map((user) => (
                                        <Option key={user.username} value={user.name}>
                                            {user.name}
                                        </Option>
                                    ))}
                                </Select>

                                <Select
                                    showSearch
                                    placeholder={t("Department.input347")}
                                    style={{ width: "100%" }}
                                    onChange={handleBophanChange}
                                    value={searchBophan || undefined}
                                    onSearch={(value) => value && searchDepartments(value)}
                                    loading={loadingDepartments}
                                    filterOption={false}
                                    allowClear
                                    notFoundContent={
                                        loadingDepartments ? (
                                            <Space>
                                                <Spin size="small" />
                                                <span>Loading...</span>
                                            </Space>
                                        ) : (
                                            null
                                        )
                                    }
                                    disabled={tableLoading}
                                >
                                    {departmentOptions.map((bophan) => (
                                        <Option key={bophan} value={bophan}>
                                            {bophan.toUpperCase()}
                                        </Option>
                                    ))}
                                </Select>

                                <Select
                                    showSearch
                                    placeholder={t("Department.input257")}
                                    style={{ width: "100%" }}
                                    onChange={handleChinhanhChange}
                                    value={searchChinhanh || undefined}
                                    onSearch={(value) => value && searchShops(value)}
                                    loading={loadingShops}
                                    filterOption={false}
                                    notFoundContent={
                                        loadingShops ? (
                                            <Space>
                                                <Spin size="small" />
                                                <span>Loading...</span>
                                            </Space>
                                        ) : (
                                            null
                                        )
                                    }
                                    allowClear
                                    disabled={tableLoading}
                                >
                                    {shopOptions.map((shop) => (
                                        <Option key={shop} value={shop}>
                                            {shop.toUpperCase()}
                                        </Option>
                                    ))}
                                </Select>

                                <Select
                                    placeholder={t("Report.input29")}
                                    style={{ width: "100%" }}
                                    onChange={handleLockerChange}
                                    value={searchLocker === null ? undefined : searchLocker}
                                    allowClear
                                    disabled={tableLoading}
                                >
                                    <Option value={true}>Tạm khóa</Option>
                                    <Option value={false}>Đang hoạt động</Option>
                                </Select>

                                <RangePicker
                                    showTime={false}
                                    format="DD-MM-YYYY"
                                    onChange={handleDateRangeChange}
                                    value={dateRange}
                                    style={{ width: "100%" }}
                                    placeholder={['Từ ngày', 'Đến ngày']}
                                    allowClear
                                    disabled={tableLoading}
                                />
                            </div>
                            <Space style={{ marginBottom: 0, flexWrap: "wrap" }}>
                                <Button type="primary" onClick={showDrawer}>
                                    {t("Department.input352")}
                                </Button>
                                <Button onClick={() => setImportModalVisible(true)} icon={<UploadOutlined />}>
                                    Import Excel
                                </Button>
                                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                                    Export Excel
                                </Button>
                            </Space>
                        </>
                    )}
                    bordered
                    columns={columns}
                    dataSource={users}
                    rowKey="keys"
                    loading={tableLoading}
                    pagination={{
                        current: currentPage,
                        total: totalItems,
                        pageSize: pageSize,
                        onChange: handlePageChange,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "20", "50", "100"],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        size: window.innerWidth < 768 ? "small" : "middle",
                    }}
                    scroll={{ x: true }}
                    style={{ width: "100%", whiteSpace: "nowrap" }}
                    footer={() => (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <Popconfirm
                                    title={t("Department.input355")}
                                    onConfirm={deleteSelectedUsers}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <Button
                                        danger
                                        disabled={Object.keys(selectedUsers).length === 0 || tableLoading}
                                        type="primary"
                                    >
                                        {t("Department.input356")} ({Object.keys(selectedUsers).length})
                                    </Button>
                                </Popconfirm>
                            </div>
                        </div>
                    )}
                    locale={{
                        emptyText: <Empty description="Trống !" />,
                    }}
                />
            </Card>

            <Modal
                title="Import Excel"
                visible={importModalVisible}
                onCancel={() => !uploading && setImportModalVisible(false)}
                footer={null}
                closable={!uploading}
                maskClosable={!uploading}
            >
                {uploading ? (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flexDirection: "column",
                            gap: 15,
                        }}
                    >
                        <p>Đang tải lên và xử lý...</p>
                        <Progress type="circle" percent={uploadProgress} />
                        <Alert
                            message="Vui lòng chờ cho đến khi quá trình tải lên toàn tất."
                            type="warning"
                            showIcon
                            banner
                        />
                    </div>
                ) : (
                    <Upload.Dragger
                        accept=".xlsx, .xls"
                        customRequest={handleUpload}
                        showUploadList={false}
                        onChange={(info) => {
                            if (info.file.status === "done") {
                                setImportModalVisible(false);
                            } else if (info.file.status === "error") {
                                message.error(`${info.file.name} upload failed.`);
                            }
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Kéo và thả file Excel vào đây hoặc nhấp để chọn file.</p>
                        <p className="ant-upload-hint">Chỉ hỗ trợ định dạng .xlsx và .xls</p>
                    </Upload.Dragger>
                )}
            </Modal>

            <Drawer
                title={editUser ? 'Edit' : 'Tạo mới'}
                width={window.innerWidth > 768 ? 800 : '100%'}
                onClose={onClose}
                visible={visible}
                bodyStyle={{ paddingBottom: 80, background: '#f5f7fa' }}
                headerStyle={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}
                extra={
                    <Button
                        type="primary"
                        onClick={() => form.submit()}
                        disabled={tableLoading || saveLoading}
                        loading={saveLoading}
                        icon={<SaveOutlined />}
                    >
                        {editUser ? t("Department.input164") : t("Department.input164")}
                    </Button>
                }
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button
                            type='primary'
                            onClick={() => window.open("/auth/docs/phan-quyen/account", "_blank")}
                            icon={<RightOutlined />}
                            disabled={tableLoading}
                            block
                        >
                            Đi đến phân quyền chung
                        </Button>
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Card
                        title={<Text strong><UserOutlined /> Thông tin cơ bản</Text>}
                        style={{ marginBottom: 16 }}
                        bordered={false}
                        headStyle={{ background: '#fafafa', padding: '8px 16px' }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="name"
                                    label={t("Department.input343")}
                                    rules={[{ required: true, message: t("Department.input359") }]}
                                >
                                    <Input
                                        disabled={tableLoading}
                                        prefix={<UserOutlined />}
                                        placeholder="Nhập họ tên"
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="username"
                                    label={t("Department.input344")}
                                    rules={[{ required: true, message: t("Department.input360") }]}
                                >
                                    <Input
                                        disabled={tableLoading}
                                        prefix={<UserOutlined />}
                                        placeholder="Nhập tên đăng nhập"
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[{ required: !editUser, message: t("Department.input361") }]}
                            tooltip={editUser ? "Để trống nếu không muốn thay đổi mật khẩu" : null}
                        >
                            <Input.Password
                                disabled={tableLoading}
                                prefix={<LockOutlined />}
                                placeholder={editUser ? "Nhập mật khẩu mới (nếu cần)" : "Nhập mật khẩu"}
                            />
                        </Form.Item>
                    </Card>

                    <Card
                        title={<Text strong><ApartmentOutlined /> Thông tin công việc</Text>}
                        style={{ marginBottom: 16 }}
                        bordered={false}
                        headStyle={{ background: '#fafafa', padding: '8px 16px' }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="code_staff" label={t("Department.input345")}>
                                    <Input
                                        type="number"
                                        disabled={tableLoading}
                                        prefix={<IdcardOutlined />}
                                        placeholder="Nhập mã nhân viên"
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={12}>
                                <Form.Item name="chucvu" label={t("Department.input346")}>
                                    <Input
                                        disabled={tableLoading}
                                        prefix={<ApartmentOutlined />}
                                        placeholder="Nhập chức vụ"
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="bophan" label={t("Department.input347")}>
                                    <Select
                                        showSearch
                                        placeholder={t("Input.input")}
                                        onSearch={debounce((value) => value && searchDepartments(value), 300)}
                                        notFoundContent={
                                            loadingDepartments ? (
                                                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                                    <Spin size="small" />
                                                    <span style={{ marginLeft: 8 }}>Loading...</span>
                                                </div>
                                            ) : null
                                        }
                                        filterOption={false}
                                        loading={loadingDepartments}
                                        allowClear
                                        style={{ textTransform: "uppercase" }}
                                        disabled={tableLoading}
                                        suffixIcon={<ApartmentOutlined />}
                                    >
                                        {departmentOptions.map((bp) => (
                                            <Option key={bp} value={bp}>
                                                {bp.toUpperCase()}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={12}>
                                <Form.Item name="chinhanh" label={t("Department.input257")}>
                                    <Select
                                        showSearch
                                        placeholder={t("Input.input")}
                                        onSearch={debounce((value) => value && searchShops(value), 300)}
                                        filterOption={false}
                                        loading={loadingShops}
                                        allowClear
                                        notFoundContent={
                                            loadingShops ? (
                                                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                                    <Spin size="small" />
                                                    <span style={{ marginLeft: 8 }}>Loading...</span>
                                                </div>
                                            ) : null
                                        }
                                        disabled={tableLoading}
                                        suffixIcon={<ShopOutlined />}
                                    >
                                        {shopOptions.map((shop) => (
                                            <Option key={shop} value={shop}>
                                                {shop}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card
                        title={<Text strong><KeyOutlined /> Phân quyền & Trạng thái</Text>}
                        bordered={false}
                        headStyle={{ background: '#fafafa', padding: '8px 16px' }}
                    >
                        <Form.Item name="phanquyen" label={t("Menu.menu4")} initialValue={false}>
                            <Select
                                disabled={tableLoading}
                                suffixIcon={<KeyOutlined />}
                            >
                                <Option value={false}>
                                    User
                                </Option>
                                <Option value={true}>
                                    Administrator
                                </Option>
                                <Option value="Xử lý yêu cầu">
                                    Request Management
                                </Option>
                                <Option value="IT asset">
                                    IT Asset Management
                                </Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="locker"
                            label={
                                <Space>
                                    <Text style={{ fontSize: "14px" }}>{t("Report.input34")}</Text>
                                    <Tooltip title="Sau khi bật tài khoản này sẽ bị khóa">
                                        <InfoCircleOutlined style={{ color: '#ff4d4f' }} />
                                    </Tooltip>
                                </Space>
                            }
                            valuePropName="checked"
                        >
                            <Switch
                                disabled={tableLoading}
                                checkedChildren="Khóa"
                                unCheckedChildren="Mở"
                            />
                        </Form.Item>
                    </Card>
                </Form>
            </Drawer>
        </div>
    );
};

export default React.memo(Account);