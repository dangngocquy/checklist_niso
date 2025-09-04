import React, { useState, useEffect, useCallback } from 'react';
import { List, Avatar, Tooltip, Spin, Empty } from 'antd';
import axios from 'axios';
import { FieldTimeOutlined } from '@ant-design/icons';
import Avatars from '../../config/design/Avatars';
import { useNavigate } from 'react-router-dom';
import UserInfoCard from '../../hook/UserInfoCard';

const ChecklistGiao = ({ user }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 6;

  const fetchData = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const apiUsername = process.env.REACT_APP_API_USERNAME;
        const authHeader = `Basic ${btoa(apiUsername)}`;

        const response = await axios.get('/checklist/matching', {
          headers: { Authorization: authHeader },
          params: {
            userKeys: user.keys,
            bophan: user.bophan,
            chinhanh: user.chinhanh || '',
            page: pageNum,
            limit: pageSize,
          },
        });

        const { data: newData, hasMore: moreAvailable } = response.data;
        const sortedData = newData.sort(
          (a, b) =>
            new Date(b.date.split('-').reverse().join('-')) -
            new Date(a.date.split('-').reverse().join('-'))
        );

        setData((prevData) => (append ? [...prevData, ...sortedData] : sortedData));
        setHasMore(moreAvailable);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user.keys, user.bophan, user.chinhanh]
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const renderAvatar = (item) => {
    const matchedUser = item.user || {};
    // Construct user object for UserInfoCard
    const userForCard = {
      name: matchedUser.name || matchedUser.username || 'Unknown User',
      username: matchedUser.username || 'N/A',
      imgAvatar: matchedUser.imgAvatar || null,
      imgBackground: matchedUser.imgBackground || null,
      locker: matchedUser.locker || false,
      keys: matchedUser.keys || 'N/A',
      email: matchedUser.email || null,
      chucvu: matchedUser.chucvu || null,
      chinhanh: matchedUser.chinhanh || 'N/A',
      bophan: matchedUser.bophan || 'N/A',
    };

    return (
      <Tooltip
        title={<UserInfoCard user={userForCard} />}
        placement={window.innerWidth < 768 ? 'top' : 'right'}
        color="white"
        overlayStyle={{ maxWidth: 300 }}
        trigger="hover"
        mouseEnterDelay={0.1}
        mouseLeaveDelay={0.2}
      >
        <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
          {userForCard.imgAvatar && userForCard.imgAvatar !== 'null' ? (
            <Avatar
              src={userForCard.imgAvatar}
              size="large"
              style={{ marginRight: 8, pointerEvents: 'auto' }}
            />
          ) : (
            <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
              <Avatars user={{ name: userForCard.name }} sizeImg="large" />
            </span>
          )}
        </span>
      </Tooltip>
    );
  };

  const onScroll = (e) => {
    if (loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  };

  if (loading && page === 1) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '22vh' }}>
        <Spin spinning={true} />
      </div>
    );
  }

  if (data.length === 0) {
    return <Empty description="Không có checklist nào được giao." />;
  }

  return (
    <Spin spinning={loading} size="small">
      <List
        style={{ height: '34vh', overflow: 'auto' }}
        dataSource={data}
        onScroll={onScroll}
        renderItem={(item) => (
          <List.Item
            onClick={() => navigate(`/auth/docs/form/${item.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <List.Item.Meta
              avatar={renderAvatar(item)}
              title={<div className="gon_nisso">{item.title || 'Untitled'}</div>}
              description={
                <span type="secondary" style={{ fontSize: 11 }}>
                  <FieldTimeOutlined /> {item.date}
                </span>
              }
            />
          </List.Item>
        )}
      >
        {loadingMore && (
          <div style={{ textAlign: 'center', padding: 10 }}>
            <Spin size="small" />
          </div>
        )}
      </List>
    </Spin>
  );
};

export default ChecklistGiao;