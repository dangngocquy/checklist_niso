import { useState, useCallback, useMemo } from 'react';
import useApi from '../useApi';
import debounce from 'lodash/debounce';

const useSearchDepartment = () => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const { searchDepartment } = useApi();

  // Hàm xử lý logic tìm kiếm
  const handleSearchDepartments = useCallback(async (value = "") => {
    setLoading(true);
    try {
      const response = await searchDepartment(value);
      const filteredData = [...new Set((response.data || []).map(dept => dept.bophan))];
      const slicedData = value ? filteredData : filteredData.slice(0, 5);
      setHasMore(!value && filteredData.length > 5);
      setOptions(slicedData);
    } catch (error) {
      console.error("Error fetching department search results:", error);
    } finally {
      setLoading(false);
    }
  }, [searchDepartment]);

  // Debounce hàm tìm kiếm
  const searchDepartments = useMemo(
    () => debounce(handleSearchDepartments, 500),
    [handleSearchDepartments]
  );

  const loadMoreDepartments = useCallback(async () => {
    if (hasMore && !loading) {
      const response = await searchDepartment();
      const allData = [...new Set((response.data || []).map(dept => dept.bophan))];
      const nextOptions = allData.slice(0, options.length + 5);
      setOptions(nextOptions);
      setHasMore(nextOptions.length < allData.length);
    }
  }, [hasMore, loading, options, searchDepartment]);

  return {
    loading,
    options,
    searchDepartments,
    loadMoreDepartments,
    hasMore,
  };
};

export default useSearchDepartment;