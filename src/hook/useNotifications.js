import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import moment from "moment";
import "moment/locale/vi";
import { FieldTimeOutlined } from "@ant-design/icons";
import { useNotificationContext } from "../notificationContext";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const getRelativeTime = (timestamp) => {
  const now = moment();
  const time = moment(timestamp, "DD/MM/YYYY HH:mm:ss");
  const diffSeconds = now.diff(time, "seconds");

  if (diffSeconds < 10) return "vừa xong";
  if (diffSeconds < 60) return `${diffSeconds} giây trước`;
  const diffMinutes = now.diff(time, "minutes");
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = now.diff(time, "hours");
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = now.diff(time, "days");
  if (diffDays < 365) return `${diffDays} ngày trước`;
  const diffYears = now.diff(time, "years");
  return `${diffYears} năm trước`;
};

const useNotifications = (user) => {
  const { notifications, setNotifications, unreadCount, setUnreadCount, total, setTotal } =
    useNotificationContext();
  const [page, setPage] = useState({ "0": 1, "2": 1, "4": 1 });
  const [loading, setLoading] = useState({ "0": false, "2": false, "4": false });
  const hasLoadedInitial = useRef({ "0": false, "2": false, "4": false });
  const scrollTriggered = useRef({ "0": false, "2": false, "4": false });

  // Hàm tính unreadCount từ danh sách thông báo
  const calculateUnreadCount = useCallback((notificationsList) => {
    return notificationsList.reduce((count, noti) => {
      const readBy = Array.isArray(noti.readBy) ? noti.readBy : [];
      return readBy.includes(user?.keys) ? count : count + 1;
    }, 0);
  }, [user?.keys]);

  const fetchNotifications = useCallback(
    async (tabKey, reset = false) => {
      if (loading[tabKey]) return;
      setLoading((prev) => ({ ...prev, [tabKey]: true }));
      try {
        const currentPage = reset ? 1 : page[tabKey];
        const response = await axios.get("/chinhanh/notifications/all", {
          params: { page: currentPage, limit: 6, phanquyen: user?.phanquyen },
          headers: { Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` },
        });
        const { notifications: newNotifications, total: newTotal } = response.data;

        const filteredNotifications = newNotifications.filter((noti) => {
          const isRestrictedEvent = [
            "CREATE_DEPARTMENT", "UPDATE_DEPARTMENT", "DELETE_DEPARTMENT", "CREATE_DEPARTMENT_BATCH", "DELETE_DEPARTMENT_BATCH",
            "CREATE_CHINHANH", "UPDATE_CHINHANH", "DELETE_CHINHANH", "CREATE_CHINHANH_BATCH", "DELETE_CHINHANH_BATCH",
            "CREATE_ACCOUNT", "UPDATE_ACCOUNT", "DELETE_ACCOUNT", "CREATE_ACCOUNT_BATCH", "DELETE_ACCOUNT_BATCH",
            "UPDATE_PERMISSIONS_USER", "UPDATE_PERMISSIONS_DEPARTMENT", "UPDATE_PERMISSIONS_RESTAURANT", "UPDATE_BATCH_PERMISSIONS",
            "CREATE_MODULE", "TRANSFER_CHINHANH"
          ].includes(noti.event);
          return !isRestrictedEvent || user?.phanquyen;
        }).filter((noti) =>
          tabKey === "0"
            ? true
            : tabKey === "2"
              ? noti.userId === user?.keys
              : noti.classify === "admin"
        );

        setNotifications((prev) => {
          const updatedNotifications = {
            ...prev,
            [tabKey]: reset ? filteredNotifications : [...prev[tabKey], ...filteredNotifications],
          };
          if (tabKey === "0") {
            setUnreadCount(calculateUnreadCount(updatedNotifications["0"]));
          }
          return updatedNotifications;
        });

        setTotal((prev) => ({
          ...prev,
          [tabKey]: newTotal,
        }));

        setPage((prev) => ({ ...prev, [tabKey]: currentPage + 1 }));
        hasLoadedInitial.current[tabKey] = true;
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading((prev) => ({ ...prev, [tabKey]: false }));
        scrollTriggered.current[tabKey] = false;
      }
    },
    [loading, page, user?.keys, user?.phanquyen, setNotifications, setTotal, setUnreadCount, calculateUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await axios.put(
        "/chinhanh/notifications/mark-all-read",
        { userKeys: user?.keys, phanquyen: user?.phanquyen },
        { headers: { Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` } }
      );
      setNotifications((prev) => {
        const updatedNotifications = {
          "0": prev["0"].map((noti) => ({
            ...noti,
            readBy: noti.readBy.includes(user?.keys) ? noti.readBy : [...noti.readBy, user?.keys],
          })),
          "2": prev["2"].map((noti) => ({
            ...noti,
            readBy: noti.readBy.includes(user?.keys) ? noti.readBy : [...noti.readBy, user?.keys],
          })),
          "4": prev["4"].map((noti) => ({
            ...noti,
            readBy: noti.readBy.includes(user?.keys) ? noti.readBy : [...noti.readBy, user?.keys],
          })),
        };
        setUnreadCount(0);
        return updatedNotifications;
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [setNotifications, setUnreadCount, user?.keys, user?.phanquyen]);

  const markAsRead = useCallback(
    async (index, tabKey) => {
      const notification = notifications[tabKey][index];
      const readBy = Array.isArray(notification.readBy) ? notification.readBy : [];
      if (!readBy.includes(user?.keys)) {
        try {
          const response = await axios.put(
            `/chinhanh/notifications/mark-read/${notification.id}`,
            { userKeys: user?.keys },
            { headers: { Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` } }
          );
          const updatedReadBy = response.data.readBy;
          setNotifications((prev) => {
            const updatedNotifications = {
              ...prev,
              [tabKey]: prev[tabKey].map((noti, i) =>
                i === index ? { ...noti, readBy: updatedReadBy } : noti
              ),
            };
            if (tabKey === "0") {
              setUnreadCount(calculateUnreadCount(updatedNotifications["0"]));
            }
            return updatedNotifications;
          });
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }
    },
    [notifications, setNotifications, setUnreadCount, user?.keys, calculateUnreadCount]
  );

  const handleScroll = useCallback(
    (tabKey) =>
      debounce((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const maxPages = Math.ceil(total[tabKey] / 6);

        if (
          scrollTop + clientHeight >= scrollHeight - 20 &&
          !loading[tabKey] &&
          !scrollTriggered.current[tabKey] &&
          page[tabKey] <= maxPages &&
          notifications[tabKey].length < total[tabKey]
        ) {
          scrollTriggered.current[tabKey] = true;
          fetchNotifications(tabKey);
        }
      }, 300),
    [fetchNotifications, loading, notifications, page, total]
  );

  const renderNotification = useCallback(
    (noti, index, tabKey) => {
      const userInfo = noti.userInfo || {};
      const readBy = Array.isArray(noti.readBy) ? noti.readBy : [];
      const isRead = readBy.includes(user?.keys);
      let message = "";

      const entityNameMap = {
        user: "tài khoản",
        department: "bộ phận",
        restaurant: "chi nhánh",
      };

      const truncateEntities = (entities, max = 3) => {
        if (entities.length <= max) return entities.join(", ");
        return `${entities.slice(0, max).join(", ")}...`;
      };

      const isRestrictedEvent = [
        "CREATE_DEPARTMENT", "UPDATE_DEPARTMENT", "DELETE_DEPARTMENT", "CREATE_DEPARTMENT_BATCH", "DELETE_DEPARTMENT_BATCH",
        "CREATE_CHINHANH", "UPDATE_CHINHANH", "DELETE_CHINHANH", "CREATE_CHINHANH_BATCH", "DELETE_CHINHANH_BATCH",
        "CREATE_ACCOUNT", "UPDATE_ACCOUNT", "DELETE_ACCOUNT", "CREATE_ACCOUNT_BATCH", "DELETE_ACCOUNT_BATCH",
        "UPDATE_PERMISSIONS_USER", "UPDATE_PERMISSIONS_DEPARTMENT", "UPDATE_PERMISSIONS_RESTAURANT", "UPDATE_BATCH_PERMISSIONS",
        "CREATE_MODULE", "TRANSFER_CHINHANH"
      ].includes(noti.event);

      if (isRestrictedEvent && !user?.phanquyen) return null;

      if (noti.event === "CREATE_DEPARTMENT") {
        const entity = noti.data.entity;
        const targetName = entity.name === user?.bophan ? "của bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Bộ phận ${targetName} đã được tạo`;
        }
      } else if (noti.event === "UPDATE_DEPARTMENT") {
        const entity = noti.data.entity;
        const targetName = entity.name === user?.bophan ? "của bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Bộ phận ${targetName} đã được cập nhật`;
        }
      } else if (noti.event === "DELETE_DEPARTMENT") {
        const entity = noti.data.entity;
        const targetName = entity.name === user?.bophan ? "của bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Bộ phận ${targetName} đã bị xóa`;
        }
      } else if (noti.event === "CREATE_DEPARTMENT_BATCH") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} mục`;
        } else {
          const entities = noti.data.entities.map(e => e.name === user?.bophan ? "của bạn" : e.name);
          message = `${entityCount} bộ phận đã được tạo: ${truncateEntities(entities)}`;
        }
      } else if (noti.event === "DELETE_DEPARTMENT_BATCH") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} mục`;
        } else {
          const entities = noti.data.entities.map(e => e.name === user?.bophan ? "của bạn" : e.name);
          message = `${entityCount} bộ phận đã bị xóa: ${truncateEntities(entities)}`;
        }
      } else if (noti.event === "CREATE_CHINHANH") {
        const entity = noti.data.entity;
        const targetName = entity.name === user?.chinhanh ? "của bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Chi nhánh ${targetName} đã được tạo`;
        }
      } else if (noti.event === "UPDATE_CHINHANH") {
        const entity = noti.data.entity;
        const targetName = entity.name === user?.chinhanh ? "của bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Chi nhánh ${targetName} đã được cập nhật`;
        }
      } else if (noti.event === "DELETE_CHINHANH") {
        const entity = noti.data.entity;
        const targetName = entity.name === user?.chinhanh ? "của bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Chi nhánh ${targetName} đã bị xóa`;
        }
      } else if (noti.event === "CREATE_CHINHANH_BATCH") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} mục`;
        } else {
          const entities = noti.data.entities.map(e => e.name === user?.chinhanh ? "của bạn" : e.name);
          message = `${entityCount} chi nhánh đã được tạo: ${truncateEntities(entities)}`;
        }
      } else if (noti.event === "DELETE_CHINHANH_BATCH") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} mục`;
        } else {
          const entities = noti.data.entities.map(e => e.name === user?.chinhanh ? "của bạn" : e.name);
          message = `${entityCount} chi nhánh đã bị xóa: ${truncateEntities(entities)}`;
        }
      } else if (noti.event === "TRANSFER_CHINHANH") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} mục`;
        } else {
          const entities = noti.data.entities.map(e => e.name === user?.chinhanh ? "của bạn" : e.name);
          message = `${entityCount} Đã di chuyển nhà hàng: ${truncateEntities(entities)}`;
        }
      } else if (noti.event === "CREATE_ACCOUNT") {
        const entity = noti.data.entity;
        const targetName = entity.id === user?.keys ? "bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Tài khoản ${targetName} đã được tạo`;
        }
      } else if (noti.event === "UPDATE_ACCOUNT") {
        const entity = noti.data.entity;
        const targetName = entity.id === user?.keys ? "bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Tài khoản ${targetName} đã được cập nhật`;
        }
      } else if (noti.event === "DELETE_ACCOUNT") {
        const entity = noti.data.entity;
        const targetName = entity.id === user?.keys ? "bạn" : entity.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${targetName}`;
        } else {
          message = `Tài khoản ${targetName} đã bị xóa`;
        }
      } else if (noti.event === "CREATE_ACCOUNT_BATCH") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} mục`;
        } else {
          const entities = noti.data.entities.map(e => e.id === user?.keys ? "bạn" : e.name);
          message = `${entityCount} tài khoản đã được tạo: ${truncateEntities(entities)}`;
        }
      } else if (noti.event === "DELETE_ACCOUNT_BATCH") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} mục`;
        } else {
          const entities = noti.data.entities.map(e => e.id === user?.keys ? "bạn" : e.name);
          message = `${entityCount} tài khoản đã bị xóa: ${truncateEntities(entities)}`;
        }
      } else if (noti.event.startsWith("UPDATE_PERMISSIONS_")) {
        const entityType = noti.event.split("_")[2].toLowerCase();
        const entity = noti.data.entity;
        const entityName = entityNameMap[entityType] || "thực thể";
        const targetName = entityType === "user" && entity.id === user?.keys ? "bạn" : entity.name || entity.id;

        if (noti.userId === user?.keys) {
          message = `Bạn vừa cập nhật quyền cho ${entityName} ${targetName}`;
        } else if (
          (entityType === "department" && user?.bophan === entity.name) ||
          (entityType === "restaurant" && user?.chinhanh === entity.name)
        ) {
          message = `Bạn vừa phân quyền cho ${entityName} của bạn: ${targetName}`;
        } else {
          const perms = Object.entries(noti.data.permissions)
            .map(([module, actions]) => `"${actions.join(", ")}"`)
            .join(";");
          message = `Đã cập nhật ${perms ? `quyền ${perms}` : "lại quyền"} cho ${entityName} ${targetName}`;
        }
      } else if (noti.event === "UPDATE_BATCH_PERMISSIONS") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa cập nhật quyền cho ${entityCount} mục`;
        } else {
          const entities = noti.data.entities.map(e => `${entityNameMap[e.type]} ${e.id === user?.keys ? "bạn" : e.name}`);
          message = `Đã cập nhật quyền cho ${entityCount} mục: ${truncateEntities(entities)}`;
        }
      } else if (noti.event === "CREATE_MODULE") {
        const moduleName = noti.data.module.name;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa tạo module ${moduleName}`;
        } else {
          message = `Module ${moduleName} đã được tạo`;
        }
      } else if (noti.event === "CREATE_CHECKLIST") {
        const entity = noti.data.entity;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} checklist ${entity.name}`;
        } else {
          message = `Checklist ${entity.name} đã được tạo`;
        }
      } else if (noti.event === "UPDATE_CHECKLIST") {
        const entity = noti.data.entity;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} thay đổi cho checklist ${entity.name}`;
        } else {
          message = `Checklist ${entity.name} đã được cập nhật`;
        }
      } else if (noti.event === "DELETE_CHECKLIST") {
        const entity = noti.data.entity;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} checklist ${entity.name}`;
        } else {
          message = `Checklist ${entity.name} đã bị xóa`;
        }
      } else if (noti.event === "DELETE_CHECKLIST_BATCH") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} checklist`;
        } else {
          const entities = noti.data.entities.map(e => e.name);
          message = `${entityCount} checklist đã bị xóa: ${truncateEntities(entities)}`;
        }
      } else if (noti.event === "SYNC_CHECKLIST_JSON") {
        const entityCount = noti.data.entities.length;
        if (noti.userId === user?.keys) {
          message = `Bạn vừa ${noti.data.action} ${entityCount} checklist`;
        } else {
          const entities = noti.data.entities.map(e => e.name);
          message = `${entityCount} checklist đã được đồng bộ: ${truncateEntities(entities)}`;
        }
      } else {
        message = noti.data.message || "Thông báo không xác định";
      }

      return (
        <div
          onClick={() => markAsRead(index, tabKey)}
          style={{
            padding: "8px",
            borderBottom: "1px solid #f0f0f0",
            backgroundColor: isRead ? "transparent" : "transparent",
            fontWeight: isRead ? "normal" : "bold",
            cursor: "pointer",
          }}
        >
          <div>{message}</div>
          {tabKey !== "2" && (
            <div style={{ color: "#555", fontSize: "12px", marginTop: 5 }}>
              <strong>{userInfo.name || "Unknown"}</strong> - {userInfo.bophan?.toUpperCase() || "Không có khối / phòng"} -{" "}
              {userInfo.chinhanh || "Không có nhà hàng"}
            </div>
          )}
          <small style={{ color: "#888" }}>
            <FieldTimeOutlined /> {getRelativeTime(noti.timestamp)}
          </small>
        </div>
      );
    },
    [markAsRead, user?.keys, user?.bophan, user?.chinhanh, user?.phanquyen]
  );

  useEffect(() => {
    moment.locale("vi");
    if (!hasLoadedInitial.current["0"]) fetchNotifications("0", true);
  }, [fetchNotifications]);

  return {
    notifications,
    total,
    page,
    loading,
    unreadCount,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    handleScroll,
    hasLoadedInitial,
    renderNotification,
  };
};

export { getRelativeTime };
export default useNotifications;