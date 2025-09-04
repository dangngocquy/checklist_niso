import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, List, message, Empty, Row, Col, Tooltip, Skeleton, Input, Button, Space, Avatar, Spin } from "antd";
import Nen from '../../assets/shop.png';
import { useNavigate } from "react-router-dom";
import { BsBookmarkFill } from "react-icons/bs";
import { AppstoreOutlined, LoadingOutlined, LockFilled, SearchOutlined, UnorderedListOutlined } from "@ant-design/icons";
import Avatars from "../../config/design/Avatars";
import useApi from "../../hook/useApi";
import debounce from 'lodash/debounce';
import UserInfoCard from "../../hook/UserInfoCard";

function ChecklistSave({ user, t }) {
  const navigate = useNavigate();
  const { request, updateChecklistBookmark } = useApi();
  const [data, setData] = useState([]);
  const [isGridView, setIsGridView] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLoading, setFilterLoading] = useState(false);

  // Sử dụng useRef để tránh re-render không cần thiết
  const loadingRef = useRef(false);
  const bookmarkLoadingRef = useRef(false);

  // Tối ưu fetching data sử dụng useCallback
  const fetchChecklistSave = useCallback(async (currentPage = 1, search = '', isRefresh = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      if (!isRefresh) {
        setFilterLoading(currentPage === 1);
        setLoadingMore(currentPage > 1);
      }

      // Biến pageSize không được sử dụng trong request, loại bỏ

      const response = await request({
        method: "GET",
        url: "/checklist/save",
        params: {
          userKeys: user.keys,
          page: currentPage,
          title: search.trim() || undefined
        }
      });

      const fetchedData = response.data || [];
      // Tối ưu quá trình chuyển đổi dữ liệu
      const enrichedData = fetchedData.map(item => ({
        ...item,
        id: item.id || `temp-${Math.random()}`,
        name: item.user?.name || item.userName || "Unknown User",
        bophan: item.user?.bophan || item.userBophan || "",
        chucvu: item.user?.chucvu || item.userChucvu || "",
        imgAvatar: item.user?.imgAvatar || item.userAvatar || null,
        username: item.user?.username || item.username || "N/A",
        imgBackground: item.user?.imgBackground || item.imgBackground || null,
        locker: item.user?.locker || item.locker || false,
        keys: item.user?.keys || item.keys || "N/A",
        email: item.user?.email || item.email || null,
        chinhanh: item.user?.chinhanh || item.userChinhanh || ""
      }));

      // Cập nhật state hiệu quả hơn
      setData(prevData => {
        if (currentPage === 1) {
          return enrichedData;
        } else {
          // Chỉ thêm các mục mới chưa có trong danh sách
          const existingIds = new Set(prevData.map(item => item.id));
          const newItems = enrichedData.filter(newItem => !existingIds.has(newItem.id));
          return [...prevData, ...newItems];
        }
      });

      setShowLoadMore(response.showLoadMore || false);
    } catch (error) {
      console.error("Error fetching saved checklists:", error);
      message.error(t('Error.fetchFailed'));
    } finally {
      if (!isRefresh) {
        setFilterLoading(false);
        setLoadingMore(false);
      }
      loadingRef.current = false;
    }
  }, [request, user.keys, t]);

  // Tối ưu debounce search với useMemo
  const debouncedFetchData = useMemo(() =>
    debounce((currentPage, term) => {
      fetchChecklistSave(currentPage, term, false);
    }, 500),
    [fetchChecklistSave]);

  // Tối ưu lifecycle với useEffect
  useEffect(() => {
    setPage(1);
    debouncedFetchData(1, searchTerm);

    return () => debouncedFetchData.cancel();
  }, [debouncedFetchData, searchTerm]);

  // Tối ưu handlers với useCallback
  const toggleView = useCallback(() => {
    setIsGridView(prev => !prev);
  }, []);

  // Tối ưu xử lý khi click vào item
  const ClickHome = useCallback((id) => {
    if (!id || typeof id !== 'string') return;

    const item = data.find(item => item.id === id);
    if (item?.locktitle === true && user.phanquyen !== true) {
      message.warning(t('Department.input159'));
      return;
    }

    navigate(`/auth/docs/form/${id}`);
  }, [data, navigate, t, user]);

  // Tối ưu xử lý bookmark
  const handleBookmarkClick = useCallback(async (e, id) => {
    e.stopPropagation();
    if (bookmarkLoadingRef.current || !id || typeof id !== 'string' || !user?.keys) return;

    try {
      bookmarkLoadingRef.current = true;
      const item = data.find(item => item.id === id);
      if (!item) return;

      const currentBookmark = Array.isArray(item.bookmark) ? item.bookmark : [];
      const updatedBookmark = currentBookmark.filter(key => key !== user.keys);

      await updateChecklistBookmark(id, { bookmark: updatedBookmark });
      await fetchChecklistSave(1, searchTerm, true);
      message.success(t('Department.input259'));
    } catch (error) {
      console.error("Error updating bookmark:", error.response?.data || error.message);
      message.error(t('Error.updateFailed'));
    } finally {
      bookmarkLoadingRef.current = false;
    }
  }, [data, user, updateChecklistBookmark, fetchChecklistSave, searchTerm, t]);

  // Tối ưu loadMore
  const loadMore = useCallback(() => {
    if (!showLoadMore || loadingMore || loadingRef.current) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchChecklistSave(nextPage, searchTerm, false);
  }, [page, showLoadMore, loadingMore, searchTerm, fetchChecklistSave]);

  // Tách AvatarContent thành component riêng để tránh re-render
  const AvatarContent = useCallback(({ item }) => (
    <Tooltip
      title={<UserInfoCard user={{
        name: item.name || 'Unknown User',
        username: item.username || 'N/A',
        imgAvatar: item.imgAvatar || null,
        imgBackground: item.imgBackground || null,
        locker: item.locker || false,
        keys: item.keys || 'N/A',
        email: item.email || null,
        chucvu: item.chucvu || null,
        chinhanh: item.chinhanh || 'N/A',
        bophan: item.bophan || 'N/A',
      }} />}
      placement={window.innerWidth < 768 ? 'top' : 'right'}
      color="white"
      overlayStyle={{ maxWidth: 300 }}
      trigger="hover"
      mouseEnterDelay={0.1}
      mouseLeaveDelay={0.2}>
      <span> {item.userAvatar ? (
        <Avatar src={item.userAvatar} size="large" />
      ) : (
        <Avatars user={item.userName ? item.userName[0].toUpperCase() : null} sizeImg="large" />
      )}
      </span>
    </Tooltip>
  ), []);

  // Tối ưu hóa renderItem - Sửa lỗi dependencies không cần thiết
  const renderItem = useCallback((item) => {
    if (!item || typeof item !== 'object' || !item.id) return null;

    const BookmarkIcon = BsBookmarkFill;
    const isSmallScreen = window.innerWidth < 768;

    if (isGridView) {
      return (
        <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} style={{ marginBottom: 16 }} key={item.id}>
          <Card
            cover={
              <div style={{ position: 'relative' }}>
                {filterLoading ? (
                  <div style={{ height: '150px', objectFit: 'cover', cursor: 'pointer', width: '100%', display: 'grid' }}>
                    <Skeleton.Image style={{ width: '100%', height: '100%' }} active />
                  </div>
                ) : (
                  <img
                    alt={item.title || "No title"}
                    src={item.background || Nen}
                    style={{ height: '150px', objectFit: 'cover', cursor: 'pointer', width: '100%' }}
                  />
                )}
                <Button
                  icon={<BookmarkIcon />}
                  shape='circle'
                  size={isSmallScreen ? "large" : "middle"}
                  style={{ position: 'absolute', top: 10, right: 10, color: "var(--border-main)" }}
                  onClick={(e) => handleBookmarkClick(e, item.id)}
                />
                {item.locktitle && <div style={{ position: 'absolute', top: 0, left: 0, backgroundColor: 'red', color: 'white', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', borderBottomRightRadius: 8 }}><LockFilled /> Tạm khóa</div>}
              </div>
            }
            hoverable
            onClick={() => ClickHome(item.id)}
          >
            {filterLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <Card.Meta
                avatar={<AvatarContent item={item} />}
                title={item.title || 'No title'}
                description={<span style={{ fontSize: 11 }}>{item.dateBookmark || item.date || 'No date'}</span>}
              />
            )}
          </Card>
        </Col>
      );
    } else {
      return (
        <List.Item
          key={item.id}
          style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: 'var(--main-boxshadow)', padding: 16, overflow: 'hidden', marginBottom: 15, cursor: 'pointer' }}
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {filterLoading ? (
                <Skeleton.Image style={{ width: 120, height: 120 }} active />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 16, position: 'relative' }}>
                  <img
                    alt={item.title || t('Misc.document')}
                    src={item.background || Nen}
                    style={{ height: isSmallScreen ? '100%' : 120, objectFit: 'cover', overflow: 'hidden', width: '100%' }}
                  />
                  {item.locktitle && <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'red', color: 'white', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', borderBottomLeftRadius: 8 }}><LockFilled /> Tạm khóa</div>}
                </div>
              )}
            </div>
          }
          actions={[
            <Button
              key="bookmark"
              icon={<BookmarkIcon />}
              onClick={(e) => handleBookmarkClick(e, item.id)}
              type='primary'
            >
              {t('Department.input260')}
            </Button>
          ]}
          onClick={() => ClickHome(item.id)}
        >
          {filterLoading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <div style={{ flex: 1 }}>
              <List.Item.Meta
                avatar={<AvatarContent item={item} />}
                title={item.title || 'Untitled'}
                description={<span style={{ fontSize: 11 }}>{item.dateBookmark || item.date || 'No date'}</span>}
              />
            </div>
          )}
        </List.Item>
      );
    }
  }, [isGridView, filterLoading, ClickHome, handleBookmarkClick, t]); // Đã loại bỏ AvatarContent khỏi dependencies

  // Tối ưu renderSkeletonItems
  const renderSkeletonItems = useCallback(() => {
    const skeletonItem = (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );

    return isGridView ? (
      <Row gutter={[16, 16]}>
        {skeletonItem}
      </Row>
    ) : (
      <List
        itemLayout="vertical"
        dataSource={skeletonItem.fill(null)}
        renderItem={(_, index) => (
          <List.Item
            key={`skeleton-list-${index}`}
            style={{ backgroundColor: '#fff', boxShadow: 'var(--main-boxshadow)', padding: 16, overflow: 'hidden', marginBottom: 15 }}
            extra={<Skeleton.Image style={{ width: 120, height: 120 }} active />}
          >
            <Skeleton active paragraph={{ rows: 2 }} />
          </List.Item>
        )}
      />
    );
  }, [isGridView]);

  // Lưu trữ bộ nhớ đệm giá trị được tính toán
  const isDataEmpty = data.length === 0;
  const isLoading = filterLoading || loadingMore;


  return (
    <div className="layout_main_niso">
      <title>NISO CHECKLIST | {t('Department.input64')}</title>

      <div style={{ marginBottom: 16, textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: 18, textTransform: 'uppercase' }}>{t('Department.input261')}</span>
        <Space>
          <Tooltip title={isGridView ? t('Department.input169') : t('Department.input170')}>
            <Button
              icon={isGridView ? <AppstoreOutlined /> : <UnorderedListOutlined />}
              onClick={toggleView}
              size="middle"
            />
          </Tooltip>
        </Space>
      </div>

      <Input
        placeholder={t('ListDocs.input11')}
        onChange={e => setSearchTerm(e.target.value)}
        value={searchTerm}
        style={{ marginBottom: 16 }}
        size="middle"
        prefix={<SearchOutlined />}
      />

      {(isLoading && isDataEmpty) ? (
        renderSkeletonItems()
      ) : isDataEmpty ? (
        <Empty description={t('Department.input262')} />
      ) : isGridView ? (
        <Row gutter={[16, 16]}>
          {data.map(renderItem)}
        </Row>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={data}
          renderItem={renderItem}
        />
      )}

      {showLoadMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button onClick={loadMore} loading={loadingMore}>
            {loadingMore ? 'Loading...' : t('Profile.input32')}
          </Button>
        </div>
      )}
    </div>
  );
}

export default React.memo(ChecklistSave);