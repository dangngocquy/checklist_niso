import { useState } from 'react';
import useApi from '../useApi';

const useSearch = () => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const { search } = useApi();

  const searchUsers = async (value, type = 'account') => {
    if (!value || value.trim() === '') {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await search(value);
      let filteredData;

      if (type === 'account') {
        filteredData = (response.data || []).map(user => ({
          username: user.keys,
          name: user.name,
          imgAvatar: user.imgAvatar || null
        }));
      } else {
        filteredData = (response.data || []).map(user => ({
          keys: user.keys,
          name: user.name,
          username: user.username,
          bophan: user.bophan,
          chinhanh: user.chinhanh,
          chucvu: user.chucvu,
          code_staff: user.code_staff,
          imgAvatar: user.imgAvatar || null
        }));
      }

      setOptions(filteredData);
    } catch (error) {
      console.error(`Lỗi khi tìm kiếm ${type}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    options,
    searchUsers
  };
};

export default useSearch;
