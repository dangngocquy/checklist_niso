import { useState, useEffect } from 'react';
import moment from 'moment';

// Custom hook để tính toán thời gian tương đối
const useRelativeTime = (dateString) => {
    const [relativeTime, setRelativeTime] = useState('');

    useEffect(() => {
        const calculateRelativeTime = () => {
            const date = moment(dateString, "DD-MM-YYYY HH:mm:ss");
            const now = moment();
            const diff = now.diff(date, 'minutes');

            if (diff < 1) return "Vừa xong";
            if (diff < 60) return `${diff} phút trước`;
            if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
            if (diff < 43200) return `${Math.floor(diff / 1440)} ngày trước`;
            if (diff < 525600) return `${Math.floor(diff / 43200)} tháng trước`;
            return `${Math.floor(diff / 525600)} năm trước`;
        };

        // Tính toán ngay lập tức khi dateString thay đổi
        setRelativeTime(calculateRelativeTime());

        // Cập nhật mỗi phút (tùy chọn, nếu bạn muốn thời gian tự động cập nhật)
        const interval = setInterval(() => {
            setRelativeTime(calculateRelativeTime());
        }, 60000); // 60 giây

        return () => clearInterval(interval);
    }, [dateString]);

    return relativeTime;
};

export default useRelativeTime;