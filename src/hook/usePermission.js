import { useState, useCallback, useMemo } from 'react';
import { Modal } from 'antd';
import axios from 'axios';

// Hàm debounce tự định nghĩa
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const usePermission = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionsCache, setPermissionsCache] = useState({});

  // Khởi tạo tất cả các state quyền với giá trị mặc định là false
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [hasPointPermission, setHasPointPermission] = useState(false);
  const [hasxemPermission, setHasXemPermission] = useState(false);
  const [hasxlphPermission, setHasXlphPermission] = useState(false);
  const [dlxlphPermission, setdlXlphPermission] = useState(false);
  const [xoaPermission, setxoaphPermission] = useState(false);
  const [ganPhanHoiPermission, setGanPhanHoiPermission] = useState(false);
  const [hasReportPermission, setHasReportPermission] = useState(false);
  const [hasCCPermission, setHasCCPermission] = useState(false);
  const [hastcvqclvPermission, setHastcvqlclvPermission] = useState(false);
  const [hasquanlyTSPermission, setHastquanlyTSPermission] = useState(false);
  const [hastXoaTSPermission, setHastXoaTSPermission] = useState(false);
  const [hastKiemKePermission, setHastKiemKePermission] = useState(false);
  const [hastCreatenotiPermission, setHastCreatenotiPermission] = useState(false);

  const checkPermission = useCallback(
    async ({ user, action, silent = false }) => {
      if (!action) {
        !silent &&
          Modal.warning({
            title: 'Thông báo',
            content: 'Hành động là bắt buộc để kiểm tra quyền',
          });
        return { hasPermission: false, error: 'Action is required', permissionsByEntity: {} };
      }

      if (!user || !user.keys) {
        !silent &&
          Modal.warning({
            title: 'Thông báo',
            content: 'Bạn cần đăng nhập để sử dụng chức năng này',
          });
        return { hasPermission: false, error: 'User not logged in', permissionsByEntity: {} };
      }

      const cacheKey = `${user.keys}-${action}`;
      if (permissionsCache[cacheKey] !== undefined) {
        const hasPermission = permissionsCache[cacheKey];
        if (!hasPermission && !silent) {
          Modal.warning({
            title: 'Thông báo',
            content: 'Bạn không có quyền sử dụng chức năng này',
          });
        }
        return { hasPermission, error: null, permissionsByEntity: { user: hasPermission } };
      }

      const entitiesToCheck = [];
      if (user.keys) entitiesToCheck.push({ type: 'user', id: user.keys });
      if (user.bophan) entitiesToCheck.push({ type: 'department', id: user.bophan });
      if (user.chinhanh) entitiesToCheck.push({ type: 'restaurant', id: user.chinhanh });

      if (entitiesToCheck.length === 0) {
        !silent &&
          Modal.warning({
            title: 'Thông báo',
            content: 'Không tìm thấy thông tin thực thể để kiểm tra quyền',
          });
        return { hasPermission: false, error: 'No entities to check', permissionsByEntity: {} };
      }

      setLoading(true);
      setError(null);

      const source = axios.CancelToken.source();
      const timeoutId = setTimeout(() => {
        source.cancel('Request timeout');
      }, 15000);

      try {
        const response = await axios.post(
          `/modules/permissions?action=${encodeURIComponent(action)}`,
          { entities: entitiesToCheck },
          {
            headers: {
              Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
            cancelToken: source.token,
            maxRetries: 0,
          }
        );

        clearTimeout(timeoutId);

        const { success, data, hasPermission } = response.data;

        if (!success) {
          !silent &&
            Modal.warning({
              title: 'Thông báo',
              content: 'Không thể kiểm tra quyền',
            });
          return { hasPermission: false, error: 'Permission check failed', permissionsByEntity: {} };
        }

        const permissionsByEntity = {};
        data.forEach(entity => {
          const entityType = entity.type.toLowerCase();
          const entityPermission = entity.success && Object.values(entity.data.permissions).some(p => p);
          permissionsByEntity[entityType] = entityPermission;
        });

        if (!hasPermission && !silent) {
          Modal.warning({
            title: 'Thông báo',
            content: 'Bạn không có quyền sử dụng chức năng này',
          });
        }

        setPermissionsCache(prev => ({ ...prev, [cacheKey]: hasPermission }));
        return { hasPermission, error: null, permissionsByEntity };
      } catch (err) {
        clearTimeout(timeoutId);

        if (axios.isCancel(err)) {
          setError('Request timeout');
          !silent &&
            Modal.warning({
              title: 'Thông báo',
              content: 'Yêu cầu kiểm tra quyền đã hết thời gian chờ',
            });
          return { hasPermission: false, error: 'Request timeout', permissionsByEntity: {} };
        }

        if (err.message === 'Network Error') {
          setError('Network error - please check your connection');
          !silent &&
            Modal.warning({
              title: 'Thông báo',
              content: 'Lỗi kết nối mạng, vui lòng kiểm tra kết nối của bạn',
            });
          return { hasPermission: false, error: 'Network error', permissionsByEntity: {} };
        }

        !silent &&
          Modal.warning({
            title: 'Thông báo',
            content: 'Đã xảy ra lỗi khi kiểm tra quyền',
          });
        setError(err.response?.data?.message || err.message);
        return {
          hasPermission: false,
          error: err.response?.data?.message || err.message,
          permissionsByEntity: {},
        };
      } finally {
        setLoading(false);
      }
    },
    [permissionsCache]
  );

  const performInitializePermission = useCallback(async (user) => {
    if (!user) {
      return;
    }

    const actionsToCheck = [
      { action: 'Tạo checklist', setter: setHasCreatePermission, current: hasCreatePermission },
      { action: 'Sửa checklist', setter: setHasEditPermission, current: hasEditPermission },
      { action: 'Cấu hình điểm nâng cao', setter: setHasPointPermission, current: hasPointPermission },
      { action: 'Xem phản hồi', setter: setHasXemPermission, current: hasxemPermission },
      { action: 'Xử lý phản hồi', setter: setHasXlphPermission, current: hasxlphPermission },
      { action: 'Xóa checklist', setter: setdlXlphPermission, current: dlxlphPermission },
      { action: 'Xóa phản hồi', setter: setxoaphPermission, current: xoaPermission },
      { action: 'Gán phản hồi', setter: setGanPhanHoiPermission, current: ganPhanHoiPermission },
      { action: 'Quản lý báo cáo', setter: setHasReportPermission, current: hasReportPermission },
      { action: 'Cho phép chấm công', setter: setHasCCPermission, current: hasCCPermission },
      { action: 'Tạo công và quản lý ca làm việc', setter: setHastcvqlclvPermission, current: hastcvqclvPermission },
      { action: 'Quản lý tài sản', setter: setHastquanlyTSPermission, current: hasquanlyTSPermission },
      { action: 'Xóa tài sản', setter: setHastXoaTSPermission, current: hastXoaTSPermission },
      { action: 'Kiểm kê tài sản', setter: setHastKiemKePermission, current: hastKiemKePermission },
      { action: 'Tạo thông báo', setter: setHastCreatenotiPermission, current: hastCreatenotiPermission },
    ];

    const actionsToFetch = actionsToCheck.filter(({ action, current }) => {
      const cacheKey = `${user.keys}-${action}`;
      const isCached = permissionsCache[cacheKey] !== undefined;
      const isInitialized = current !== false;
      return !isCached && !isInitialized;
    });

    if (actionsToFetch.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const entities = [
        { type: 'user', id: user.keys },
        ...(user.bophan ? [{ type: 'department', id: user.bophan }] : []),
        ...(user.chinhanh ? [{ type: 'restaurant', id: user.chinhanh }] : []),
      ];

      const response = await axios.post(
        '/modules/permissions',
        {
          entities,
          actions: actionsToFetch.map((a) => a.action),
        },
        {
          headers: {
            Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const results = response.data.data || [];
      console.log('API Response:', response.data); // Debug API response

      actionsToFetch.forEach(({ action, setter }) => {
        const permissionsByEntity = {};
        results.forEach((result) => {
          if (result.success && result.data && result.data.permissions) {
            permissionsByEntity[result.type.toLowerCase()] =
              result.data.permissions[action] || false;
          } else {
            permissionsByEntity[result.type?.toLowerCase()] = false;
          }
        });
        const combinedPermission =
          permissionsByEntity.user === true ||
          permissionsByEntity.department === true ||
          permissionsByEntity.restaurant === true;

        setter(combinedPermission);
        const cacheKey = `${user.keys}-${action}`;
        setPermissionsCache((prev) => ({ ...prev, [cacheKey]: combinedPermission }));
      });
    } catch (error) {
      console.error('Error initializing permissions:', error);
      await Promise.all(
        actionsToFetch.map(async ({ action, setter }) => {
          const { hasPermission } = await checkPermission({
            user,
            action,
            silent: true,
          });
          setter(hasPermission);
        })
      );
    } finally {
      setLoading(false);
    }
  }, [
    checkPermission,
    permissionsCache,
    hasCreatePermission,
    hasEditPermission,
    hasxemPermission,
    hasxlphPermission,
    dlxlphPermission,
    xoaPermission,
    ganPhanHoiPermission,
    hasReportPermission,
    hasCCPermission,
    hastcvqclvPermission,
    hasquanlyTSPermission,
    hastKiemKePermission,
    hastXoaTSPermission,
    hastCreatenotiPermission,
    hasPointPermission,
  ]);

  const initializePermission = useMemo(
    () => debounce((user) => performInitializePermission(user), 300),
    [performInitializePermission]
  );

  const refreshPermissions = useCallback(
    async (user) => {
      setPermissionsCache({});
      await initializePermission(user);
    },
    [initializePermission]
  );

  // Hàm để xóa permissionsCache và đặt lại các state quyền về false
  const clearPermissionsCache = useCallback(() => {
    setPermissionsCache({});
    setHasCreatePermission(false);
    setHasPointPermission(false);
    setHasEditPermission(false);
    setHasXemPermission(false);
    setHasXlphPermission(false);
    setdlXlphPermission(false);
    setxoaphPermission(false);
    setGanPhanHoiPermission(false);
    setHasReportPermission(false);
    setHasCCPermission(false);
    setHastcvqlclvPermission(false);
    setHastquanlyTSPermission(false);
    setHastXoaTSPermission(false);
    setHastKiemKePermission(false);
    setHastCreatenotiPermission(false);
  }, []);

  return {
    checkPermission,
    initializePermission,
    refreshPermissions,
    clearPermissionsCache, // Thêm hàm này vào object trả về
    loading,
    error,
    hasCreatePermission,
    hasEditPermission,
    hasxemPermission,
    hasxlphPermission,
    dlxlphPermission,
    xoaPermission,
    ganPhanHoiPermission,
    hasReportPermission,
    hasCCPermission,
    hastcvqclvPermission,
    hasquanlyTSPermission,
    hastKiemKePermission,
    hasPointPermission,
    hastXoaTSPermission,
    hastCreatenotiPermission,
    setHasCreatePermission,
    setHasEditPermission,
    setHasPointPermission,
    setHasXemPermission,
    setHasXlphPermission,
    setdlXlphPermission,
    setxoaphPermission,
    setGanPhanHoiPermission,
    setHasReportPermission,
    setHasCCPermission,
    setHastcvqlclvPermission,
    setHastKiemKePermission,
    setHastXoaTSPermission,
    setHastquanlyTSPermission,
  };
};

export default usePermission;