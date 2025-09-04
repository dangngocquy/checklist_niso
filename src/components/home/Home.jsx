import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  List,
  Empty,
  Row,
  Col,
  Tooltip,
  Skeleton,
  message,
  Input,
  Button,
  Space,
  Modal,
  Select,
  Avatar,
  Spin,
  Tabs,
} from "antd";
import Nen from "../../assets/shop.png";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { FullscreenOutlined, AppstoreOutlined, UnorderedListOutlined, PlusCircleOutlined, LockFilled, SearchOutlined } from "@ant-design/icons";
import Avatars from "../../config/design/Avatars";
import Home2 from "./Home2";
import useApi from "../../hook/useApi";
import useSearchDepartment from "../../hook/SearchDepartment/useSearchDepartment";
import moment from "moment";
import debounce from "lodash/debounce";
import ChecklistSave from "../danhsachsave/ChecklistSave";
import UserInfoCard from "../../hook/UserInfoCard";

function Home({ user, phanquyenchecklist, hasCreatePermission, t }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchAllChecklistsCustom, updateChecklist } = useApi();
  const {
    loading: searchLoading,
    options: departmentOptions,
    searchDepartments,
  } = useSearchDepartment();

  const [data, setData] = useState([]);
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") === "savedChecklists" ? "savedChecklists" : "myChecklists";
  const [activeTab, setActiveTab] = useState(initialTab);

  const searchTermRef = useRef(searchTerm);
  const selectedDepartmentRef = useRef(selectedDepartment);
  const userKeysRef = useRef(user.keys);
  const loadingRef = useRef(loading);
  const loadingMoreRef = useRef(loadingMore);
  const fetchAllChecklistsCustomRef = useRef(fetchAllChecklistsCustom);
  const searchDepartmentsRef = useRef(searchDepartments);
  const tRef = useRef(t);

  useEffect(() => {
    searchTermRef.current = searchTerm;
    selectedDepartmentRef.current = selectedDepartment;
    userKeysRef.current = user.keys;
    loadingRef.current = loading;
    loadingMoreRef.current = loadingMore;
    fetchAllChecklistsCustomRef.current = fetchAllChecklistsCustom;
    searchDepartmentsRef.current = searchDepartments;
    tRef.current = t;
  }, [
    searchTerm,
    selectedDepartment,
    user.keys,
    loading,
    loadingMore,
    fetchAllChecklistsCustom,
    searchDepartments,
    t,
  ]);

  const fetchData = useCallback(
    async (pageToFetch = 1, append = false) => {
      if ((loadingRef.current && append) || (loadingMoreRef.current && append)) return;

      setLoading(!append);
      setLoadingMore(append);

      try {
        const filters = {
          bophan: selectedDepartmentRef.current,
          title: searchTermRef.current,
          userKeys: userKeysRef.current || "",
        };

        const response = await fetchAllChecklistsCustomRef.current(pageToFetch, 6, filters);
        const newData = response.data || [];
        const filteredData = newData.filter((item) => item.keysJSON === userKeysRef.current);

        setData((prev) => (append ? [...prev, ...filteredData] : filteredData));
        setTotalPages(response.totalPages);
        setPage(pageToFetch);
      } catch (error) {
        console.error("Error fetching checklists:", error);
        message.success(tRef.current("Thử lại sau vài giây."));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  const debouncedSearchRef = useRef();
  useEffect(() => {
    debouncedSearchRef.current = debounce(() => {
      setPage(1);
      fetchDataRef.current(1, false);
    }, 500);
    return () => debouncedSearchRef.current.cancel();
  }, []);

  useEffect(() => {
    fetchDataRef.current(1, false);
    searchDepartmentsRef.current("");
  }, []);

  useEffect(() => {
    if (searchTerm !== "" || selectedDepartment !== "") {
      debouncedSearchRef.current();
    }
  }, [searchTerm, selectedDepartment]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const toggleView = useCallback(() => setIsGridView((prev) => !prev), []);

  const ClickHome = useCallback(
    (id) => {
      const item = data.find((item) => item.id === id);
      if (item?.locktitle === true && user.phanquyen !== true) {
        message.warning(t("Department.input159"));
      } else if (id && typeof id === "string") {
        navigate(`/auth/docs/form/${id}`);
      }
    },
    [data, navigate, t, user.phanquyen]
  );

  const handleBookmarkClick = useCallback(
    async (e, id) => {
      e.stopPropagation();
      const item = data.find((item) => item.id === id);
      if (!item || !user?.keys) return;

      if (item.locktitle === true && user.phanquyen !== true) {
        message.warning(t("Department.input159"));
        return;
      }

      try {
        const currentBookmark = Array.isArray(item.bookmark) ? [...item.bookmark] : [];
        const isBookmarked = currentBookmark.includes(user.keys);
        let updatedBookmark = isBookmarked
          ? currentBookmark.filter((key) => key !== user.keys)
          : [...currentBookmark, user.keys];
        let updatedDateBookmark = isBookmarked
          ? updatedBookmark.length > 0
            ? item.dateBookmark
            : null
          : moment().format("DD-MM-YYYY HH:mm:ss");

        setData((prevData) =>
          prevData.map((d) =>
            d.id === id ? { ...d, bookmark: updatedBookmark, dateBookmark: updatedDateBookmark } : d
          )
        );

        await updateChecklist(id, { bookmark: updatedBookmark, dateBookmark: updatedDateBookmark }, true);
        message.success(isBookmarked ? t("Department.input162") : t("Department.input160"));
      } catch (error) {
        console.error("Error updating bookmark:", error);
        setData((prevData) =>
          prevData.map((d) =>
            d.id === id ? { ...d, bookmark: item.bookmark, dateBookmark: item.dateBookmark } : d
          )
        );
        message.error("Vui lòng thử lại sau vài giây.");
      }
    },
    [data, t, updateChecklist, user.keys, user.phanquyen]
  );

  const handleDepartmentChange = useCallback((value) => {
    setSelectedDepartment(value);
    setPage(1);
  }, []);

  const handleSearchDepartment = useCallback((value) => {
    searchDepartmentsRef.current(value);
  }, []);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loadingMore && !loading) {
      const nextPage = page + 1;
      fetchDataRef.current(nextPage, true);
    }
  }, [page, totalPages, loadingMore, loading]);

  const renderItem = useCallback(
    (item) => {
      if (!item || typeof item !== "object" || !item.id) return null;

      const isBookmarked = Array.isArray(item.bookmark) && item.bookmark.includes(user.keys);
      const BookmarkIcon = isBookmarked ? BsBookmarkFill : BsBookmark;
      const userInfo = item.user || { name: "Unknown", imgAvatar: null, bophan: "", chucvu: "" };

      const avatarContent = (
        <Tooltip
          title={<UserInfoCard user={{
            name: userInfo.name || userInfo.username || 'Unknown User',
            username: userInfo.username || 'N/A',
            imgAvatar: userInfo.imgAvatar || null,
            imgBackground: userInfo.imgBackground || null,
            locker: userInfo.locker || false,
            keys: userInfo.keys || 'N/A',
            email: userInfo.email || null,
            chucvu: userInfo.chucvu || null,
            chinhanh: userInfo.chinhanh || 'N/A',
            bophan: userInfo.bophan || 'N/A',
          }} />}
          placement={window.innerWidth < 768 ? 'top' : 'right'}
          color="white"
          overlayStyle={{ maxWidth: 300 }}
          trigger="hover"
          mouseEnterDelay={0.1}
          mouseLeaveDelay={0.2}>
          <span>
            {userInfo.imgAvatar ? (
              <Avatar src={userInfo.imgAvatar} size="large" />
            ) : (
              <Avatars user={userInfo.name ? userInfo.name[0].toUpperCase() : "U"} sizeImg="large" />
            )}
          </span>
        </Tooltip>
      );

      const cardContent = (
        <Card.Meta
          avatar={avatarContent}
          title={item.title || "Untitled"}
          description={<span style={{ fontSize: 11 }}>{item.date || "No date"}</span>}
        />
      );

      return isGridView ? (
        <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} style={{ marginBottom: 16 }} key={item.id}>
          <Card
            bordered={false}
            cover={
              <div style={{ position: "relative" }}>
                <img
                  alt={item.title || "Document"}
                  src={item.background || Nen}
                  style={{
                    height: window.innerWidth < 768 ? "100%" : 120,
                    objectFit: "cover",
                    cursor: "pointer",
                    width: "100%",
                    overflow: "hidden",
                  }}
                  loading="lazy"
                />
                <Button
                  shape="circle"
                  icon={<BookmarkIcon />}
                  size={window.innerWidth < 768 ? "large" : "middle"}
                  style={{ position: "absolute", top: 10, right: 10, color: "var(--border-main)" }}
                  onClick={(e) => handleBookmarkClick(e, item.id)}
                />
                {item.locktitle && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      backgroundColor: "red",
                      color: "white",
                      padding: "2px 8px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      borderBottomRightRadius: 8,
                    }}
                  >
                    <LockFilled /> Tạm khóa
                  </div>
                )}
              </div>
            }
            hoverable
            onClick={() => ClickHome(item.id)}
          >
            {cardContent}
          </Card>
        </Col>
      ) : (
        <List.Item
          key={item.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: "#fff",
            boxShadow: "var(--main-boxshadow)",
            padding: 16,
            overflow: "hidden",
            marginBottom: 15,
            cursor: "pointer",
          }}
          extra={
            <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
              <img
                alt={item.title || t("Misc.document")}
                src={item.background || Nen}
                style={{
                  height: window.innerWidth < 768 ? "100%" : 120,
                  objectFit: "cover",
                  overflow: "hidden",
                  width: "100%",
                }}
                loading="lazy"
              />
              {item.locktitle && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "red",
                    color: "white",
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    borderBottomLeftRadius: 8,
                  }}
                >
                  <LockFilled /> Tạm khóa
                </div>
              )}
            </div>
          }
          actions={[
            <Button
              key="bookmark"
              icon={<BookmarkIcon />}
              type={isBookmarked ? "primary" : "default"}
              onClick={(e) => handleBookmarkClick(e, item.id)}
            >
              {isBookmarked ? t("Department.input163") : t("Department.input164")}
            </Button>,
          ]}
          onClick={() => ClickHome(item.id)}
        >
          <List.Item.Meta avatar={avatarContent} title={item.title || "Untitled"} description={<span style={{ fontSize: 11 }}>{item.date || "No date"}</span>} />
        </List.Item>
      );
    },
    [isGridView, ClickHome, handleBookmarkClick, t, user.keys]
  );

  const renderSkeletonItems = useCallback(
    () =>
      Array(6)
        .fill(null)
        .map((_, index) =>
          isGridView ? (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={`skeleton-${index}`} style={{ marginBottom: 16 }}>
              <Card cover={<Skeleton.Image style={{ width: "100%", height: "150px" }} active bordered={false} />}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ) : (
            <List.Item
              key={`skeleton-list-${index}`}
              style={{
                backgroundColor: "#fff",
                boxShadow: "var(--main-boxshadow)",
                padding: 16,
                overflow: "hidden",
                marginBottom: 15,
              }}
              extra={<Skeleton.Image style={{ width: 120, height: 120 }} active />}
            >
              <Skeleton active paragraph={{ rows: 2 }} />
            </List.Item>
          )
        ),
    [isGridView]
  );

  const handleClick = useCallback(async () => {
    if (hasCreatePermission === false) {
      Modal.warning({
        title: 'Thông báo',
        content: 'Bạn không có quyền sử dụng chức năng này.',
        okButtonProps: {
          style: {
            backgroundColor: '#ae8f3d',
          }
        },
      });
    } else {
      navigate('/auth/docs/create');
    }
  }, [hasCreatePermission, navigate]);

  const handleFullScreenClick = useCallback(() => {
    navigate("/auth/docs/danh-sach-da-luu");
  }, [navigate]);

  const renderedItems = useMemo(() => data.map((item) => renderItem(item)), [data, renderItem]);
  const skeletonItems = useMemo(() => renderSkeletonItems(), [renderSkeletonItems]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const newUrl = key === "savedChecklists" ? "/auth/docs/home?tab=savedChecklists" : "/auth/docs/home";
    navigate(newUrl, { replace: true });
  };

  const tabItems = [
    {
      key: "myChecklists",
      label: user.phanquyen ? "Tất cả checklist" : "Checklist của bạn",
      children: (
        <div className="layout_main_niso">
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            className="mobile__layout__home"
          >
            <Space align="center" size="middle" style={{ justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontWeight: "bold", fontSize: 18, textTransform: "uppercase" }}>
                {user.phanquyen ? "Tất cả checklist" : "Checklist của bạn"}
              </span>
              <Space style={{ width: "100%", justifyContent: "end", flexWrap: "wrap" }}>
                <Tooltip title={isGridView ? t("Department.input169") : t("Department.input170")}>
                  <Button icon={isGridView ? <AppstoreOutlined /> : <UnorderedListOutlined />} onClick={toggleView} />
                </Tooltip>
              </Space>
            </Space>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12, gap: 12 }}>
            <Input
              placeholder={t("ListDocs.input11")}
              onChange={handleSearchChange}
              value={searchTerm}
              prefix={<SearchOutlined />}
              size="middle"
              style={{ width: window.innerWidth < 768 ? '100%' : '80%' }}
            />
            {user.phanquyen && (
              <Select
                showSearch
                placeholder={t("Report.input14") || "Chọn Khối / Phòng"}
                onChange={handleDepartmentChange}
                onSearch={handleSearchDepartment}
                value={selectedDepartment || undefined}
                allowClear
                variant='filled'
                style={{ width: window.innerWidth < 768 ? '100%' : '20%' }}
                size="middle"
                filterOption={false}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    {searchLoading && (
                      <Space style={{ padding: 8 }}>
                        <Spin size="small" />
                        <span>Loading...</span>
                      </Space>
                    )}
                  </>
                )}
              >
                {departmentOptions.map((dept) => (
                  <Select.Option key={dept} value={dept}>
                    {dept.toUpperCase()}
                  </Select.Option>
                ))}
              </Select>
            )}
          </div>

          {loading ? (
            isGridView ? (
              <Row gutter={[16, 16]}>{skeletonItems}</Row>
            ) : (
              <List itemLayout="vertical" dataSource={skeletonItems} renderItem={(item) => item} />
            )
          ) : data.length === 0 ? (
            <Empty description={t("ListEdits.input2")}>
              <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleClick}>
                {t("Phanquyen.input40")}
              </Button>
            </Empty>
          ) : isGridView ? (
            <Row gutter={[16, 16]}>{renderedItems}</Row>
          ) : (
            <List itemLayout="vertical" dataSource={data} renderItem={renderItem} />
          )}
          {page < totalPages && !loadingMore && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button onClick={loadMore} loading={loadingMore}>
                {loadingMore ? "Đang tải..." : t("Profile.input32")}
              </Button>
            </div>
          )}
          {loadingMore && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Spin size="small" />
            </div>
          )}
        </div>
      ),
    },
    ...(hasCreatePermission ? [{
      key: "savedChecklists",
      label: "Đã Lưu",
      children: <ChecklistSave user={user} t={t} />,
    }] : []),
  ];

  return (
    <div>
      <title>NISO CHECKLIST | HOME</title>
      <Home2 user={user} t={t} hasCreatePermission={hasCreatePermission} />
      {hasCreatePermission &&
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          type="card"
          size="small"
          className="Tabs__Home__niso"
          tabBarExtraContent={
            activeTab === "savedChecklists" ? (
              <Tooltip title="Xem toàn trang">
                <Button
                  type='link'
                  shape="circle"
                  icon={<FullscreenOutlined />}
                  onClick={handleFullScreenClick}
                  style={{ marginRight: 8 }}
                >Xem toàn trang</Button>
              </Tooltip>
            ) : null
          }
        />
      }
    </div>
  );
}

export default React.memo(Home, (prevProps, nextProps) => {
  return (
    prevProps.user.keys === nextProps.user.keys &&
    prevProps.user.phanquyen === nextProps.user.phanquyen &&
    prevProps.t === nextProps.t
  );
});