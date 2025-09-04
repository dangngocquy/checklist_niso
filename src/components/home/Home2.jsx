import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Card,
  List,
  message,
  Empty,
  Row,
  Col,
  Tooltip,
  Skeleton,
  Input,
  Button,
  Divider,
  Avatar,
  Spin,
} from "antd";
import Nen from "../../assets/shop.png";
import { useNavigate } from "react-router-dom";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { AppstoreOutlined, LockFilled, SearchOutlined, UnorderedListOutlined } from "@ant-design/icons";
import Avatars from "../../config/design/Avatars";
import { debounce } from 'lodash';
import UserInfoCard from "../../hook/UserInfoCard";

// Create separate components for list items to prevent re-renders
const GridItem = React.memo(({ item, user, handleBookmarkClick, onClick, t }) => {
  const isBookmarked = Array.isArray(item.bookmark) && item.bookmark.includes(user.keys);
  const BookmarkIcon = isBookmarked ? BsBookmarkFill : BsBookmark;
  const userInfo = item.user || {};

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
      mouseLeaveDelay={0.2}
    >
      <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
        {userInfo.imgAvatar && userInfo.imgAvatar !== 'null' ? (
          <Avatar
            src={userInfo.imgAvatar}
            size="large"
            style={{ marginRight: 8, pointerEvents: 'auto' }}
          />
        ) : (
          <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
            <Avatars user={{ name: userInfo.name || userInfo.username || 'Unknown' }} sizeImg="large" />
          </span>
        )}
      </span>
    </Tooltip>
  );

  return (
    <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} style={{ marginBottom: 16 }}>
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
                overflow: 'hidden',
              }}
              loading="lazy"
            />
            <Button
              shape='circle'
              icon={<BookmarkIcon />}
              size={window.innerWidth < 768 ? "large" : "middle"}
              style={{ position: "absolute", top: 10, right: 10, color: "var(--border-main)" }}
              onClick={(e) => {
                e.stopPropagation();
                handleBookmarkClick(e, item.id);
              }}
            />
            {item.locktitle && (
              <div style={{ position: 'absolute', top: 0, left: 0, backgroundColor: 'red', color: 'white', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', borderBottomRightRadius: 8 }}>
                <LockFilled /> Tạm khóa
              </div>
            )}
          </div>
        }
        hoverable
        onClick={() => onClick(item.id)}
      >
        <Card.Meta
          avatar={avatarContent}
          title={item.title || "Untitled"}
          description={<span style={{ fontSize: 11 }}>{item.date || "No date"}</span>}
        />
      </Card>
    </Col>
  );
});

const ListItem = React.memo(({ item, user, handleBookmarkClick, onClick, t }) => {
  const isBookmarked = Array.isArray(item.bookmark) && item.bookmark.includes(user.keys);
  const BookmarkIcon = isBookmarked ? BsBookmarkFill : BsBookmark;
  const userInfo = item.user || {};

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
      mouseLeaveDelay={0.2}
    >
      <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
        {userInfo.imgAvatar && userInfo.imgAvatar !== 'null' ? (
          <Avatar
            src={userInfo.imgAvatar}
            size="large"
            style={{ marginRight: 8, pointerEvents: 'auto' }}
          />
        ) : (
          <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
            <Avatars user={{ name: userInfo.name || userInfo.username || 'Unknown' }} sizeImg="large" />
          </span>
        )}
      </span>
    </Tooltip>
  );

  return (
    <List.Item
      style={{
        display: "flex",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        boxShadow: "var(--main-boxshadow)",
        padding: 16,
        overflow: 'hidden',
        marginBottom: 15,
        cursor: "pointer",
      }}
      extra={
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <img
            alt={item.title || t('Misc.document')}
            src={item.background || Nen}
            style={{ height: window.innerWidth < 768 ? '100%' : 120, objectFit: 'cover', overflow: 'hidden', width: '100%' }}
            loading="lazy"
          />
          {item.locktitle && (
            <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'red', color: 'white', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', borderBottomLeftRadius: 8 }}>
              <LockFilled /> Tạm khóa
            </div>
          )}
        </div>
      }
      actions={[
        <Button
          icon={<BookmarkIcon />}
          type={isBookmarked ? 'primary' : 'default'}
          onClick={(e) => {
            e.stopPropagation();
            handleBookmarkClick(e, item.id);
          }}
        >
          {isBookmarked ? t("Department.input163") : t("Department.input164")}
        </Button>,
      ]}
      onClick={() => onClick(item.id)}
    >
      <List.Item.Meta
        avatar={avatarContent}
        title={item.title || "Untitled"}
        description={<span style={{ fontSize: 11 }}>{item.date || "No date"}</span>}
      />
    </List.Item>
  );
});

// Main component
function Home2({ user, hasCreatePermission, t }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 6;

  // Use constant values for API auth to prevent recalculation
  const apiUsername = process.env.REACT_APP_API_USERNAME;
  const authHeader = useMemo(() => `Basic ${btoa(apiUsername)}`, [apiUsername]);

  // Date parser optimized with useCallback
  const parseDate = useCallback((dateString) => {
    if (!dateString) return new Date(0);
    const [day, month, yearAndTime] = dateString.split("-");
    const [year, time] = yearAndTime.split(" ");
    return new Date(`${year}-${month}-${day}T${time}`);
  }, []);

  // Optimize fetch data with useCallback
  const fetchData = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const response = await axios.get("/checklist/matching", {
          headers: { Authorization: authHeader },
          params: {
            ...(user.keys && { userKeys: user.keys }),
            ...(user.bophan && { bophan: user.bophan }),
            ...(user.chinhanh && { chinhanh: user.chinhanh }),
            page: pageNum,
            limit: pageSize,
            searchTerm: searchTerm || undefined,
          },
        });

        const { data: newData, hasMore } = response.data;

        // Avoid unnecessary sorting if already sorted from API
        const sortedData = newData.sort((a, b) => parseDate(b.date) - parseDate(a.date));

        setData((prevData) => (append ? [...prevData, ...sortedData] : sortedData));
        setHasMore(hasMore);
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error.message);
        message.error("Error fetching checklists");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user.keys, user.bophan, user.chinhanh, authHeader, parseDate, searchTerm]
  );

  // Debounce search to prevent excessive rerenders
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      setSearchTerm(value);
      setPage(1);
      fetchData(1, false);
    }, 300),
    [fetchData]
  );

  // Handle search input change with debounce
  const handleSearchChange = useCallback((e) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  // Fetch data on initial load
  useEffect(() => {
    fetchData(1);
    return () => {
      debouncedSearch.cancel();
    };
  }, [fetchData, debouncedSearch]);

  // Toggle view optimization
  const toggleView = useCallback(() => {
    setIsGridView((prev) => !prev);
  }, []);

  // Handle click optimization
  const handleItemClick = useCallback((id) => {
    const item = data.find((item) => item.id === id);
    if (item && item.locktitle === true && user.phanquyen !== true) {
      message.warning(t("Department.input159"));
    } else if (id && typeof id === "string") {
      navigate(`/auth/docs/form/${id}`);
    }
  }, [data, navigate, t, user.phanquyen]);

  // Bookmark handler optimization
  const handleBookmarkClick = useCallback(
    async (e, id) => {
      e.stopPropagation();
      const item = data.find((item) => item.id === id);

      if (!item) return;

      if (item.locktitle === true && user.phanquyen !== true) {
        message.warning(t("Department.input159"));
        return;
      }

      try {
        const currentBookmark = Array.isArray(item.bookmark) ? [...item.bookmark] : [];
        const isBookmarked = currentBookmark.includes(user.keys);

        let updatedBookmark;
        if (isBookmarked) {
          updatedBookmark = currentBookmark.filter((key) => key !== user.keys);
        } else {
          updatedBookmark = [...currentBookmark, user.keys];
        }

        const response = await axios.put(
          `/checklist/update/${id}`,
          { bookmark: updatedBookmark },
          { headers: { Authorization: authHeader } }
        );

        if (response.status === 200) {
          setData((prevData) =>
            prevData.map((item) =>
              item.id === id ? { ...item, bookmark: updatedBookmark } : item
            )
          );
          message.success(isBookmarked ? t("Department.input162") : t("Department.input160"));
        }
      } catch (error) {
        console.error("Error updating bookmark:", error);
        message.error("Error server");
      }
    },
    [data, user.keys, user.phanquyen, t, authHeader]
  );

  // Filter data with useMemo to avoid unnecessary recalculations
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.title &&
        typeof item.title === "string" &&
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Load more handler optimization
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  }, [fetchData, page]);

  // Skeleton loaders optimization with useMemo
  const skeletonItems = useMemo(() => {
    return Array(pageSize).fill(null).map((_, index) => (
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={`skeleton-${index}`} style={{ marginBottom: 16 }}>
        <Card
          cover={
            <div style={{ height: "150px", objectFit: "cover", cursor: "pointer", width: "100%", display: "grid" }}>
              <Skeleton.Image style={{ width: "100%", height: "100%" }} active />
            </div>
          }
        >
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      </Col>
    ));
  }, [pageSize]);

  const skeletonListItems = useMemo(() => {
    return Array(pageSize).fill(null).map((_, index) => (
      <List.Item
        key={`skeleton-list-${index}`}
        style={{
          backgroundColor: "#fff",
          boxShadow: "var(--main-boxshadow)",
          padding: 16,
          overflow: 'hidden',
          marginBottom: 15,
        }}
        extra={<Skeleton.Image style={{ width: 120, height: 120 }} active />}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </List.Item>
    ));
  }, [pageSize]);

  return (
    <>
      <Divider style={{ margin: 0 }} />
      <div style={{ background: hasCreatePermission ? "#fff" : "transparent" }} className="layout_main_niso">
        <div
          style={{
            marginBottom: 12,
            textAlign: "right",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: '100%'
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: 18, textAlign: "left", textTransform: "uppercase" }}>
            {t("Department.input171")}
          </span>
          <Tooltip title={isGridView ? t("Department.input169") : t("Department.input170")}>
            <Button
              icon={isGridView ? <AppstoreOutlined /> : <UnorderedListOutlined />}
              onClick={toggleView}
            />
          </Tooltip>
        </div>
        <Input
          placeholder={t("ListDocs.input11")}
          onChange={handleSearchChange}
          size="middle"
          prefix={<SearchOutlined />}
          style={{ marginBottom: 12 }}
        />
        {loading ? (
          isGridView ? (
            <Row gutter={[16, 16]}>{skeletonItems}</Row>
          ) : (
            <List itemLayout="vertical" dataSource={[]} renderItem={() => { }}>
              {skeletonListItems}
            </List>
          )
        ) : filteredData.length === 0 ? (
          <Empty description={t("ListEdits.input2")} />
        ) : (
          <>
            {isGridView ? (
              <Row gutter={[16, 16]}>
                {filteredData.map((item) => (
                  <GridItem
                    key={item.id}
                    item={item}
                    user={user}
                    handleBookmarkClick={handleBookmarkClick}
                    onClick={handleItemClick}
                    t={t}
                  />
                ))}
              </Row>
            ) : (
              <List
                itemLayout="vertical"
                dataSource={filteredData}
                renderItem={(item) => (
                  <ListItem
                    key={item.id}
                    item={item}
                    user={user}
                    handleBookmarkClick={handleBookmarkClick}
                    onClick={handleItemClick}
                    t={t}
                  />
                )}
              />
            )}
            {loadingMore && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Spin size="small" />
              </div>
            )}
            {hasMore && !loadingMore && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Button onClick={loadMore}>{t("Profile.input32")}</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default React.memo(Home2);