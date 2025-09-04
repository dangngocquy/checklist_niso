import { useState, useCallback } from "react";
import debounce from "lodash/debounce";

const useSearchShop = (searchShopApi) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchShops = useCallback(
    (value, callback) => {
      const debouncedSearch = debounce(async (val, cb) => {
        if (!val || val.trim() === "") {
          setOptions([]);
          setLoading(false);
          cb?.([]);
          return;
        }

        setLoading(true);
        try {
          const response = await searchShopApi(val, 1, 100);
          const shopList = (response.data || []).map((item) => item.restaurant);
          setOptions(shopList);
          cb?.(shopList);
        } catch (error) {
          console.error("Error searching shops:", error);
          setOptions([]);
          cb?.([]);
        } finally {
          setLoading(false);
        }
      }, 300);

      debouncedSearch(value, callback);
    },
    [searchShopApi] // Dependency duy nhất
  );

  return { options, loading, searchShops };
};

export default useSearchShop;