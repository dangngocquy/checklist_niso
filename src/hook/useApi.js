import { useState, useCallback } from "react";
import axios from "axios";

// Retry function to handle failed requests
const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});

  const request = useCallback(
    async (config, errorMessage = "Lỗi, Vui lòng thử lại sau vài giây.") => {
      setLoading(true);
      setError(null);
      const source = axios.CancelToken.source();
      const enhancedConfig = {
        ...config,
        cancelToken: source.token,
        headers: {
          'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
          ...config.headers,
        },
      };

      try {
        // Kiểm tra tùy chọn noRetry trong config
        const response = enhancedConfig.noRetry
          ? await axios(enhancedConfig) // Không retry
          : await withRetry(() => axios(enhancedConfig), 3, 1000); // Có retry

        if (response.data.success !== false) {
          return response.data;
        } else {
          throw new Error(response.data.message || errorMessage);
        }
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Invalidate cache method
  const invalidateCache = useCallback(() => {
    setCache({});
  }, []);

  // Department API
  const departmentApi = {
    fetchAll: useCallback(
      async (search = "", page = 1, limit = 5, pagination = true) => {
        const cacheKey = `${search}_${page}_${limit}_${pagination}`;
        if (cache[cacheKey]) return cache[cacheKey];

        const response = await request({
          method: "GET",
          url: "/tablea/all",
          params: { page, limit, search, pagination: pagination ? undefined : 'false' },
        });
        setCache(prev => ({ ...prev, [cacheKey]: response }));
        return response;
      },
      [request, cache]
    ),

    searchDepartment: useCallback(
      async (search = "") => {
        return request({
          method: "GET",
          url: "/tablea/search",
          params: { search }
        });
      },
      [request]
    ),

    add: useCallback(
      async (data) => {
        const response = await request({
          method: "POST",
          url: "/tablea/add",
          data,
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    update: useCallback(
      async (id, data) => {
        const response = await request({
          method: "PUT",
          url: `/tablea/update/${id}`,
          data,
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    delete: useCallback(
      async (id, userKeys) => { // Thêm tham số userKeys
        const response = await request({
          method: "DELETE",
          url: `/tablea/delete/${id}`,
          data: { userKeys }, // Gửi userKeys trong body
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    deleteMultiple: useCallback(
      async (ids, userKeys) => { // Thêm tham số userKeys
        const response = await request({
          method: "DELETE",
          url: "/tablea/deleteall",
          data: { ids, userKeys }, // Gửi userKeys trong body
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),
  };

  // Response API
  const responseApi = {

    fetchAllResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}, userData = {}) => {
        return request({
          method: "POST",
          url: "/traloi/all-responses",
          params: { page, pageSize, ...filters },
          data: userData,
        });
      },
      [request]
    ),

    fetchAssignedResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}, userData = {}) => {
        return request({
          method: "POST",
          url: "/traloi/assigned-responses",
          params: { page, pageSize, ...filters },
          data: userData, // Gửi thông tin user qua body
        });
      },
      [request]
    ),

    fetchOverdueResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}) => {
        return request({
          method: "POST",
          url: "/traloi/overdue-responses",
          params: { page, pageSize, ...filters },
        });
      },
      [request]
    ),

    // Trong responseApi
    fetchResponseCounts: useCallback(
      async (filters = {}, userData = {}) => {
        return request({
          method: "POST",
          url: "/traloi/response-counts",
          params: { ...filters },
          data: userData,
        });
      },
      [request]
    ),

    fetchRestrictedMatchingResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}, userData = {}) => {
        return request({
          method: "POST", // Đổi sang POST để gửi body
          url: "/traloi/restricted/matching-responses",
          params: { page, pageSize, ...filters },
          data: userData, // Gửi userData qua body
        });
      },
      [request]
    ),
    fetchRestrictedProcessingResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}, userData = {}) => {
        return request({
          method: "POST", // Đổi sang POST
          url: "/traloi/restricted/processing-responses",
          params: { page, pageSize, ...filters },
          data: userData,
        });
      },
      [request]
    ),
    fetchRestrictedCompletedResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}, userData = {}) => {
        return request({
          method: "POST", // Đổi sang POST
          url: "/traloi/restricted/completed-responses",
          params: { page, pageSize, ...filters },
          data: userData,
        });
      },
      [request]
    ),
    fetchRestrictedOverdueResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}, userData = {}) => {
        return request({
          method: "POST", // Đổi sang POST
          url: "/traloi/restricted/overdue-responses",
          params: { page, pageSize, ...filters },
          data: userData,
        });
      },
      [request]
    ),
    fetchRestrictedAssignedResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}, userData = {}) => {
        return request({
          method: "POST",
          url: "/traloi/restricted/assigned-responses",
          params: { page, pageSize, ...filters },
          data: userData,
        });
      },
      [request]
    ),
    fetchRestrictedResponseCounts: useCallback(
      async (filters = {}, userData = {}) => {
        return request({
          method: "POST",
          url: "/traloi/restricted/response-counts",
          params: { ...filters },
          data: userData,
        });
      },
      [request]
    ),

    fetchMatchingResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}) => {
        return request({
          method: "POST",
          url: "/traloi/matching-responses",
          params: { page, pageSize, ...filters },
        });
      },
      [request]
    ),

    update: useCallback(
      async (id, data) => {
        const response = await request({
          method: "PUT",
          url: `/traloi/update/${id}`,
          data,
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),


    fetchAllTraloi: useCallback(
      async (page, pageSize, filters = {}, userKeys = 'all') => {
        const response = await request({
          method: "GET",
          url: "/traloi/all",
          params: {
            page,
            pageSize,
            ...filters,
            userKeys: userKeys !== 'all' ? userKeys : undefined,
          },
        });
        return response;
      },
      [request]
    ),

    fetchProcessingResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}) => {
        return request({
          method: "POST",
          url: "/traloi/processing-responses",
          params: { page, pageSize, ...filters },
        });
      },
      [request]
    ),

    fetchCompletedResponses: useCallback(
      async (page = 1, pageSize = 5, filters = {}) => {
        return request({
          method: "POST",
          url: "/traloi/completed-responses",
          params: { page, pageSize, ...filters },
        });
      },
      [request]
    ),

    fetchResponsesByChecklistId: useCallback(
      async (checklistId) => {
        return request({
          method: "GET",
          url: `/traloi/by-checklist/${checklistId}`,
        });
      },
      [request]
    ),

    fetchById: useCallback(
      async (id) => {
        return request({
          method: "GET",
          url: `/traloi/get/${id}`,
        });
      },
      [request]
    ),

    fetchByCommentId: useCallback(
      async (id) => {
        return request({
          method: "GET",
          url: `/traloi/comment/${id}`,
        });
      },
      [request]
    ),

    fetchUserByKeys: useCallback(
      async (keys) => {
        return request({
          method: "GET",
          url: `/users/get-by-keys/${keys}`,
        });
      },
      [request]
    ),

    add: useCallback(
      async (data) => {
        const response = await request({
          method: "POST",
          url: "/traloi/add",
          data,
        });
        if (response.message && response.message.includes('skipped insertion')) {
          console.log(response.message);
        }
        return response;
      },
      [request]
    ),

    delete: useCallback(
      async (id) => {
        const response = await request({
          method: "DELETE",
          url: `/traloi/delete/${id}`,
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    deleteBatch: useCallback(
      async (ids) => {
        const response = await request({
          method: "POST",
          url: "/traloi/deleteBatch",
          data: { ids },
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    updatePermissions: useCallback(
      async (id, data) => {
        const response = await request({
          method: "PUT",
          url: `/traloi/updadequyen/${id}`,
          data,
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    sync: useCallback(
      async (data, onUploadProgress) => {
        const response = await request({
          method: "POST",
          url: "/traloi/sync",
          data,
          headers: { "Content-Type": "application/json" },
          onUploadProgress,
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    updateTaskProcessing: useCallback(
      async (documentId, questionId, data) => {
        return request({
          method: "PUT",
          url: `/traloi/xulynhiemvu/${documentId}/${questionId}`,
          data,
        });
      },
      [request]
    ),

    addReply: useCallback(
      async (documentId, questionId, reply) => {
        return request({
          method: "POST",
          url: `/traloi/phanhoi/${documentId}`,
          data: { reply, questionId },
        });
      },
      [request]
    ),

    addNestedReply: useCallback(
      async (documentId, questionId, replyId, nestedReply) => {
        return request({
          method: "POST",
          url: `/traloi/phanhoi/nested/${documentId}`,
          data: { nestedReply, questionId, replyId },
        });
      },
      [request]
    ),

    pinReply: useCallback(
      async (documentId, questionId, replyId, isPinned) => {
        return request({
          method: "PUT",
          url: "/traloi/phanhoi/pin",
          data: { documentId, questionId, replyId, isPinned },
        });
      },
      [request]
    ),

    fetchRepliesByResponseId: useCallback(
      async (responseId, questionId) => {
        return request({
          method: "GET",
          url: `/traloi/replies/${responseId}/${questionId}`,
        });
      },
      [request]
    ),

    pinNestedReply: useCallback(
      async (documentId, questionId, replyId, nestedReplyId, isPinned) => {
        return request({
          method: "PUT",
          url: "/traloi/phanhoi/nested/pin",
          data: { documentId, questionId, replyId, nestedReplyId, isPinned },
        });
      },
      [request]
    ),
  };

  // Checklist API
  const checklistApi = {
    fetchSavedChecklistsByUserKeys: useCallback(
      async (userKeys, page = 1, limit = 8) => {
        return request({
          method: "GET",
          url: "/checklist/saved-by-user",
          params: { userKeys, page, limit },
        });
      },
      [request]
    ),

    update: useCallback(
      async (id, data, skipSuccess = false) => {
        return request({
          method: "PUT",
          url: `/checklist/update/${id}`,
          data,
        });
      },
      [request]
    ),

    fetchAll: useCallback(
      async (page = 1, limit = 5, filters = {}) => {
        return request({
          method: "GET",
          url: "/checklist/all",
          params: { page, limit, ...filters },
        });
      },
      [request]
    ),

    fetchChecklistTitles: useCallback(
      async (search = "") => {
        return request({
          method: "GET",
          url: "/checklist/titles",
          params: { search: search || undefined },
        });
      },
      [request]
    ),

    fetchAllCustom: useCallback(
      async (page = 1, limit = 6, filters = {}) => {
        return request({
          method: "GET",
          url: "/checklist/custom/all",
          params: {
            page,
            limit,
            bophan: filters.bophan || undefined,
            title: filters.title || undefined,
            userKeys: filters.userKeys || undefined, // Đảm bảo userKeys được truyền
          },
        });
      },
      [request]
    ),

    fetchById: useCallback(
      async (id) => {
        return request({
          method: "GET",
          url: `/checklist/all/${id}`,
        });
      },
      [request]
    ),

    syncChecklists: useCallback(
      async (data) => {
        return request({
          method: "POST",
          url: "/checklist/sync",
          data,
          headers: { "Content-Type": "application/json" },
        });
      },
      [request]
    ),

    fetchAllNoPagination: useCallback(
      async () => {
        return request({
          method: "GET",
          url: "/checklist/all",
        });
      },
      [request]
    ),

    create: useCallback(
      async (data) => {
        return request({
          method: "POST",
          url: "/checklist/create",
          data,
        });
      },
      [request]
    ),

    updateBookmark: useCallback(
      async (id, data) => {
        return request({
          method: "PUT",
          url: `/checklist/update/${id}`,
          data,
        });
      },
      [request]
    ),

    delete: useCallback(
      async (id) => {
        return request({
          method: "DELETE",
          url: `/checklist/delete/${id}`,
        });
      },
      [request]
    ),

    deleteMultiple: useCallback(
      async (ids) => {
        const response = await request({
          method: "POST",
          url: "/checklist/delete-multiple",
          data: { ids },
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    saveDoc: useCallback(
      async (data) => {
        return request({
          method: "POST",
          url: "/checklist/add",
          data,
        });
      },
      [request]
    ),

    fetchUserChecklists: useCallback(
      async (userKeys, page = 1, pageSize = 5, filters = {}) => {
        return request({
          method: "GET",
          url: "/checklist/user",
          params: {
            userKeys,
            page,
            pageSize,
            title: filters.title || undefined,
            status: filters.status || undefined,
            startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
            endDate: filters.endDate ? filters.endDate.toISOString() : undefined
          },
        });
      },
      [request]
    ),
  };

  // Search function
  const search = useCallback(
    async (searchTerm, additionalParams = {}) => {
      return request({
        method: "GET",
        url: "/users/search",
        params: { search: searchTerm || undefined, ...additionalParams }
      });
    },
    [request]
  );

  // Branch API
  const branchApi = {
    fetchAll: useCallback(
      async ({ search = "" } = {}) => {
        return request({
          method: "GET",
          url: `/chinhanh/all?pagination=false&search=${encodeURIComponent(search)}`,
        });
      },
      [request]
    ),

    transferBranches: useCallback(
      async (branchIds, userKeys, options = {}) => {
        const response = await request({
          method: "POST",
          url: "/chinhanh/transfer",
          data: { branchIds, userKeys, action: options.action || "transfer" },
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    searchChinhanh: useCallback(
      async (search = "", page = 1, limit = 10) => {
        return request({
          method: "GET",
          url: "/chinhanh/search",
          params: { search, page, limit, pagination: "true" },
        });
      },
      [request]
    ),

    add: useCallback(
      async (data, isBatch = false) => {
        return request({
          method: "POST",
          url: "/chinhanh/add",
          data: isBatch ? { batch: true, batchData: data, userKeys: data[0]?.userKeys } : data,
        });
      },
      [request]
    ),

    update: useCallback(
      async (id, data) => {
        return request({
          method: "PUT",
          url: `/chinhanh/edit/update/${id}`,
          data,
        });
      },
      [request]
    ),

    delete: useCallback(
      async (id, userKeys) => { // Add userKeys parameter
        return request({
          method: "DELETE",
          url: `/chinhanh/delete/${id}`,
          data: { userKeys }, // Include userKeys in the body
        });
      },
      [request]
    ),

    deleteMultiple: useCallback(
      async (ids, userKeys) => { // Add userKeys parameter
        return request({
          method: "DELETE",
          url: "/chinhanh/deleteall",
          data: { ids, userKeys }, // Include both ids and userKeys
        });
      },
      [request]
    ),
  };

  // User API (with additional enhancements)
  const userApi = {
    fetchAll: useCallback(
      async (page = 1, limit = 5, filters = {}) => {
        return request({
          method: "GET",
          url: "/users/all",
          params: { page, limit, ...filters },
        });
      },
      [request]
    ),

    fetchAllNoPagination: useCallback(
      async (search = "") => {
        return request({
          method: "GET",
          url: "/users/all",
          params: { pagination: "false", search: search || undefined },
        });
      },
      [request]
    ),

    add: useCallback(
      async (data) => {
        return request({
          method: "POST",
          url: "/users/add",
          data: { ...data, userKeys: data.userKeys },
        });
      },
      [request]
    ),

    checkUserExists: useCallback(
      async (username, keys) => {
        return request({
          method: "GET",
          url: "/users/check",
          params: { username, keys },
        });
      },
      [request]
    ),

    update: useCallback(
      async (id, data) => {
        return request({
          method: "PUT",
          url: `/users/update/${id}`,
          data: { ...data, userKeys: data.userKeys },
        });
      },
      [request]
    ),
    delete: useCallback(
      async (id, { userKeys }) => {
        return request({
          method: "DELETE",
          url: `/users/delete/${id}`,
          data: { userKeys },
        });
      },
      [request]
    ),

    // Additional userApi methods
    fetchUserById: useCallback(
      async (id) => {
        return request({
          method: "GET",
          url: `/users/get/${id}`,
        });
      },
      [request]
    ),

    fetchUserPermissions: useCallback(
      async (id) => {
        return request({
          method: "GET",
          url: `/users/permissions/${id}`,
        });
      },
      [request]
    ),

    updateStatus: useCallback(
      async (id, status) => {
        return request({
          method: "PUT",
          url: `/users/status/${id}`,
          data: { status },
        });
      },
      [request]
    ),

    updateMultiple: useCallback(
      async (usersData) => {
        return request({
          method: "PUT",
          url: "/users/update-multiple",
          data: { users: usersData },
        });
      },
      [request]
    ),

    deleteMultiple: useCallback(
      async (keysArray, userKeys) => {
        const response = await request({
          method: "POST",
          url: "/users/delete-multiple",
          data: { keysArray, userKeys },
        });
        invalidateCache();
        return response;
      },
      [request, invalidateCache]
    ),

    fetchAllUsers: useCallback(
      async () => {
        return request({
          method: "GET",
          url: "/users/all",
          params: { pagination: "false" },
        });
      },
      [request]
    ),

    fetchPermissions: useCallback(
      async () => {
        return request({
          method: "GET",
          url: "/phanquyen/all",
        });
      },
      [request]
    ),

    updateBackground: useCallback(
      async (userId, imgBackground) => {
        return request({
          method: "PUT",
          url: `/users/upload-background/${userId}`,
          data: { imgBackground },
        });
      },
      [request]
    ),

    changePassword: useCallback(
      async (userId, { oldPassword, password }) => {
        return request({
          method: 'PUT',
          url: `/users/changepassword/${userId}`,
          data: { oldPassword, password },
        });
      },
      [request]
    ),
  };

  // Report API
  const reportApi = {
    fetchAll: useCallback(
      async (page = 1, limit = 12, userKeys = "all", currentUser) => {
        return request({
          method: "GET",
          url: `/report/all`,
          params: {
            page,
            limit,
            ...(userKeys !== "all" && { userKeys }),
            ...(currentUser && { currentUser })
          },
        });
      },
      [request]
    ),

    add: useCallback(
      async (data) => {
        return request({
          method: "POST",
          url: "/report/add",
          data,
        });
      },
      [request]
    ),

    update: useCallback(
      async (id, data) => {
        return request({
          method: "PUT",
          url: `/report/update/${id}`,
          data,
        });
      },
      [request]
    ),

    delete: useCallback(
      async (id) => {
        return request({
          method: "DELETE",
          url: `/report/delete/${id}`,
        });
      },
      [request]
    ),

    deleteMultiple: useCallback(
      async (keys) => {
        return request({
          method: "POST",
          url: "/report/delete-multiple",
          data: { keys },
        });
      },
      [request]
    ),

    fetchById: useCallback(
      async (keys) => {
        return request({
          method: "GET",
          url: `/report/get/${keys}`,
        });
      },
      [request]
    ),
  };

  // Authentication API
  const authApi = {
    login: useCallback(
      async (data) => {
        return request(
          {
            method: "POST",
            url: "/login/dashboard",
            data,
            noRetry: true, // Vô hiệu hóa retry cho login
          },
          "Sai thông tin đăng nhập."
        );
      },
      [request]
    ),

    addLoginHistory: useCallback(
      async (data) => {
        return request({
          method: "POST",
          url: "/history/login/add",
          data,
        });
      },
      [request]
    ),

    updateLoginHistory: useCallback(
      async (data) => {
        return request({
          method: "PUT",
          url: "/history/login/update",
          data,
        });
      },
      [request]
    ),
  };

  // Miscellaneous API
  const miscApi = {

    fetchPermissions: useCallback(
      async () => {
        return request({
          method: "GET",
          url: "/phanquentaikhoan/all",
        });
      },
      [request]
    ),

    addContent: useCallback(
      async (data) => {
        return request({
          method: "POST",
          url: "/content/add",
          data,
        });
      },
      [request]
    ),

    // Thêm phương thức lấy tất cả nội dung đã nhóm
    fetchAllContentGrouped: useCallback(
      async () => {
        return request({
          method: "GET",
          url: "/content/all-grouped",
        });
      },
      [request]
    ),

    // Thêm phương thức xóa một nội dung
    deleteContent: useCallback(
      async (keys) => {
        return request({
          method: "DELETE",
          url: `/content/delete/${keys}`,
        });
      },
      [request]
    ),

    // Thêm phương thức xóa nhiều nội dung
    deleteMultipleContents: useCallback(
      async (keys) => {
        return request({
          method: "POST",
          url: "/content/delete-all",
          data: { keys },
        });
      },
      [request]
    ),


    checkTitleExists: useCallback(
      async (title, keysJSON, checklistId) => {
        return request({
          method: 'GET',
          url: '/checklist/check-title',
          params: { title, keysJSON, checklistId }
        });
      },
      [request]
    ),

    fetchAllCreateData: useCallback(
      async () => {
        setLoading(true);
        try {
          const [bophanResponse, checklistResponse, usersResponse] = await Promise.all([
            request({
              method: "GET",
              url: "/tablea/all",
              params: { pagination: "false" },
            }),
            request({
              method: "GET",
              url: "/checklist/all",
            }),
            request({
              method: "GET",
              url: "/users/all",
              params: { pagination: "false" },
            }),
          ]);

          return {
            bophanData: bophanResponse.items || [],
            checklistData: checklistResponse || [],
            usersData: usersResponse.data || [],
          };
        } catch (error) {
          throw error;
        } finally {
          setLoading(false);
        }
      },
      [request]
    ),
  };

  // Return structured API groups and backwards compatibility
  return {
    loading,
    error,
    request,
    departmentApi,
    responseApi,
    checklistApi,
    branchApi,
    userApi,
    reportApi,
    authApi,
    search,
    miscApi,

    // Backwards compatibility
    loginPost: authApi.login,
    updateLoginHistory: authApi.updateLoginHistory,
    addLoginHistory: authApi.addLoginHistory,
    addBranch: branchApi.add,
    fetchBranches: branchApi.fetchAll,
    updateBranch: branchApi.update,
    deleteBranch: branchApi.delete,
    deleteMultipleBranches: branchApi.deleteMultiple,
    searchShop: branchApi.searchChinhanh,
    transferBranches: branchApi.transferBranches,
    fetchDocById: checklistApi.fetchById,
    fetchChecklistAll: checklistApi.fetchAllNoPagination,
    updateChecklistBookmark: checklistApi.updateBookmark,
    fetchChecklists: checklistApi.fetchAll,
    updateChecklistDoc: checklistApi.update,
    fetchSavedChecklistsByUserKeys: checklistApi.fetchSavedChecklistsByUserKeys,
    fetchChecklistById: checklistApi.fetchById,
    fetchAllChecklists: checklistApi.fetchAllNoPagination,
    fetchAllChecklistsCustom: checklistApi.fetchAllCustom,
    deleteChecklist: checklistApi.delete,
    deleteMultipleChecklists: checklistApi.deleteMultiple,
    updateChecklist: checklistApi.update,
    createChecklist: checklistApi.create,
    fetchChecklistTitles: checklistApi.fetchChecklistTitles,
    saveChecklistDoc: checklistApi.saveDoc,
    syncChecklists: checklistApi.syncChecklists,
    submitResponse: responseApi.add,
    fetchAssignedResponses: responseApi.fetchAssignedResponses,
    fetchResponseById: responseApi.fetchById,
    fetchByCommentId: responseApi.fetchByCommentId,
    updateTaskProcessing: responseApi.updateTaskProcessing,
    addReply: responseApi.addReply,
    addNestedReply: responseApi.addNestedReply,
    fetchProcessingResponses: responseApi.fetchProcessingResponses,
    fetchCompletedResponses: responseApi.fetchCompletedResponses,
    fetchOverdueResponses: responseApi.fetchOverdueResponses,
    pinReply: responseApi.pinReply,
    fetchRepliesByResponseId: responseApi.fetchRepliesByResponseId,
    pinNestedReply: responseApi.pinNestedReply,
    deleteResponse: responseApi.delete,
    deleteBatchResponses: responseApi.deleteBatch,
    updateResponsePermissions: responseApi.updatePermissions,
    updateResponse: responseApi.update,
    syncResponses: responseApi.sync,
    fetchAllResponses: responseApi.fetchAllResponses,
    fetchResponseCounts: responseApi.fetchResponseCounts,
    fetchAllTraloi: responseApi.fetchAllTraloi,
    fetchDepartments: departmentApi.fetchAll,
    addDepartment: departmentApi.add,
    updateDepartment: departmentApi.update,
    deleteDepartment: departmentApi.delete,
    deleteMultipleDepartments: departmentApi.deleteMultiple,
    fetchUsers: userApi.fetchAll,
    fetchAllUsers: userApi.fetchAllNoPagination,
    deleteMultipleUsers: userApi.deleteMultiple,
    addUser: userApi.add,
    checkUserExists: userApi.checkUserExists,
    updateUser: userApi.update,
    deleteUser: userApi.delete,
    fetchReports: reportApi.fetchAll,
    addReport: reportApi.add,
    updateReport: reportApi.update,
    fetchMatchingResponses: responseApi.fetchMatchingResponses,
    deleteReport: reportApi.delete,
    deleteMultipleReports: reportApi.deleteMultiple,
    addContent: miscApi.addContent,
    fetchPermissions: miscApi.fetchPermissions,
    fetchRestrictedMatchingResponses: responseApi.fetchRestrictedMatchingResponses,
    fetchRestrictedProcessingResponses: responseApi.fetchRestrictedProcessingResponses,
    fetchRestrictedCompletedResponses: responseApi.fetchRestrictedCompletedResponses,
    fetchRestrictedOverdueResponses: responseApi.fetchRestrictedOverdueResponses,
    fetchRestrictedAssignedResponses: responseApi.fetchRestrictedAssignedResponses,
    fetchRestrictedResponseCounts: responseApi.fetchRestrictedResponseCounts,
    fetchAllCreateData: miscApi.fetchAllCreateData,
    fetchAllContentGrouped: miscApi.fetchAllContentGrouped,
    deleteContent: miscApi.deleteContent,
    deleteMultipleContents: miscApi.deleteMultipleContents,
    fetchUserChecklists: checklistApi.fetchUserChecklists,
    searchDepartment: departmentApi.searchDepartment,
  };
};

export default useApi;