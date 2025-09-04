import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Card, Select, Input, Alert, Form, Space, Spin } from 'antd';
import moment from 'moment';
import 'moment/locale/vi';
import { MdLocationOn } from 'react-icons/md';
import useSearchShop from '../../hook/SearchShop/useSearchShop';
import useApi from '../../hook/useApi';
import axios from 'axios';
import NotFoundPage from '../NotFoundPage';

const { Option } = Select;
const { TextArea } = Input;

const ChamCong = ({ user, locations, country, getStyle, NutLichSu, css, hasCCPermission, onCloseDrawer }) => {
  const [timekeepingStatus, setTimekeepingStatus] = useState('out');
  const [reason, setReason] = useState(null);
  const [otherReason, setOtherReason] = useState(null);
  const [note, setNote] = useState('');
  const [currentTime, setCurrentTime] = useState(moment());
  const [otherReasonError, setOtherReasonError] = useState('');
  const [selectedShift, setSelectedShift] = useState(null);
  const [lateAlert, setLateAlert] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(user?.chinhanh || '');
  const [locationPermission, setLocationPermission] = useState(null);
  const [timekeepingLoading, setTimekeepingLoading] = useState(false);
  const [availableShifts, setAvailableShifts] = useState([]); // New state for available shifts
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [currentIp, setCurrentIp] = useState(null);
  const [ipMatch, setIpMatch] = useState(null);
  const [shopIpwanMap, setShopIpwanMap] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hideShiftSelection, setHideShiftSelection] = useState(false);
  const [timekeepingId, setTimekeepingId] = useState(null);

  const api = useApi();
  const { options, loading, searchShops } = useSearchShop(api.searchShop);

  moment.locale('vi');

  const fetchCurrentIp = useCallback(async () => {
    try {
      const response = await axios.get('https://api.db-ip.com/v2/free/self');
      const ipAddress = response.data.ipAddress;
      setCurrentIp(ipAddress);
    } catch (error) {
      console.error('Error fetching current IP:', error.message);
      setCurrentIp(null);
    }
  }, []);

  const fetchShopIpwan = useCallback(async () => {
    try {
      const response = await api.searchShop('', 1, 100);
      const shopList = response.data || [];
      const ipwanMap = {};
      shopList.forEach((shop) => {
        ipwanMap[shop.restaurant] = shop.ipwan;
      });
      setShopIpwanMap(ipwanMap);

      if (user?.chinhanh && ipwanMap[user.chinhanh]) {
        setSelectedRestaurant(user.chinhanh);
        if (currentIp) {
          setIpMatch(ipwanMap[user.chinhanh] === currentIp);
        }
      }
    } catch (error) {
      console.error('Error fetching shop IP data:', error);
      setShopIpwanMap({});
    }
  }, [user?.chinhanh, currentIp, api]);

  useEffect(() => {
    if (isInitialLoad) {
      fetchCurrentIp();
      fetchShopIpwan();
      setIsInitialLoad(false);
    }
  }, [fetchCurrentIp, fetchShopIpwan, isInitialLoad]);

  useEffect(() => {
    if (currentIp && selectedRestaurant && shopIpwanMap[selectedRestaurant] !== undefined) {
      setIpMatch(shopIpwanMap[selectedRestaurant] === currentIp);
    }
  }, [currentIp, selectedRestaurant, shopIpwanMap]);

  const fetchWorkShifts = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const response = await fetch(`/api/user-timekeeping?maNhanVien=${encodeURIComponent(user.keys)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Lỗi HTTP ${response.status}`);
      const result = await response.json();
      const data = Array.isArray(result.data) ? result.data : result;

      // Lọc các ca chưa checkout (đã được backend xử lý, nhưng kiểm tra lại để chắc chắn)
      const available = data.filter(shift => shift.Status !== 'checkout');
      setAvailableShifts(available);

      if (data.length > 0 && data[0]._id) {
        setTimekeepingId(data[0]._id);
        setIsCheckedIn(data[0].Status === 'checkin');
        setTimekeepingStatus(data[0].Status === 'checkin' ? 'in' : 'out');
        setHideShiftSelection(available.length === 0); // Ẩn dropdown nếu không còn ca nào
      } else {
        setHideShiftSelection(false);
      }
    } catch (error) {
      console.error('Fetch Error (Work Shifts):', error);
      message.error(`Lỗi khi lấy danh sách ca làm việc: ${error.message}`);
      setAvailableShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  }, [user.keys]);

  useEffect(() => {
    fetchWorkShifts();
  }, [fetchWorkShifts]);

  const handleSearch = (value) => {
    searchShops(value);
  };

  // Cập nhật useEffect để tính toán lateAlert
  useEffect(() => {
    if (availableShifts.length > 0 && !hideShiftSelection) {
      const now = moment();
      let nearestShift = availableShifts[0];
      let minDifference = Infinity;

      availableShifts.forEach((shift) => {
        const shiftStart = moment(shift.gioVao, 'HH:mm');
        const difference = Math.abs(now.diff(shiftStart));
        if (difference < minDifference) {
          minDifference = difference;
          nearestShift = shift;
        }
      });

      setSelectedShift(nearestShift);

      if (!isCheckedIn && now.isAfter(moment(nearestShift.gioVao, 'HH:mm'))) {
        const late = now.diff(moment(nearestShift.gioVao, 'HH:mm'), 'minutes');
        setLateAlert(late >= 60 ? `Bạn đã trễ ${Math.floor(late / 60)} giờ ${late % 60} phút` : `Bạn đã trễ ${late} phút`);
      } else {
        setLateAlert(null);
      }
    } else {
      setSelectedShift(null);
      setLateAlert(null);
    }
  }, [availableShifts, isCheckedIn, hideShiftSelection]);

  const performTimekeeping = useCallback(async () => {
    setTimekeepingLoading(true);
    try {
      const currentMoment = moment();
      const newStatus = isCheckedIn ? 'checkout' : 'checkin';
      const timekeepingData = {
        maNhanVien: user.keys,
        ngay: currentMoment.format('DD-MM-YYYY'),
        IPNhaHang: currentIp,
        IPGoc: shopIpwanMap[selectedRestaurant],
        location: `${locations} - ${country}`,
        GioCham: newStatus === 'checkin' ? currentMoment.format('DD/MM/YYYY HH:mm:ss') : undefined,
        GioOut: newStatus === 'checkout' ? currentMoment.format('DD/MM/YYYY HH:mm:ss') : undefined,
        CaLamViec: selectedShift ? `${selectedShift.loaiCong}: (${selectedShift.gioVao} - ${selectedShift.gioRa})` : undefined,
        LychoChamCong: reason === 'Khác' ? [otherReason] : reason ? [reason] : null,
        GhiChu: note || undefined,
        Status: newStatus,
        Restaurants: selectedRestaurant,
        ChamTre: lateAlert ? lateAlert.replace('Bạn đã trễ', 'Trễ') : undefined, // Thêm trường ChamTre
      };

      let response;
      if (newStatus === 'checkin' && timekeepingId) {
        response = await fetch(`/api/timekeeping/${timekeepingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timekeepingData),
        });
      } else if (newStatus === 'checkin') {
        response = await fetch('/api/timekeeping', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timekeepingData),
        });
      } else {
        response = await fetch(`/api/timekeeping/${timekeepingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timekeepingData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi xử lý chấm công');
      }

      const result = await response.json();
      message.success(result.message);

      if (newStatus === 'checkin' && !timekeepingId) {
        setTimekeepingId(result.data._id);
      }

      setTimekeepingStatus(newStatus === 'checkin' ? 'in' : 'out');
      setIsCheckedIn(newStatus === 'checkin');
      setHideShiftSelection(newStatus === 'checkout' && availableShifts.length <= 1);
      setReason(null);
      setOtherReason(null);
      setNote('');
      setLateAlert(null);

      if (newStatus === 'checkout') {
        fetchWorkShifts();
      }

      if (onCloseDrawer) {
        onCloseDrawer();
      }

    } catch (error) {
      console.error('Timekeeping Error:', error);
      message.error(`Lỗi: ${error.message}`);
    } finally {
      setTimekeepingLoading(false);
    }
  }, [isCheckedIn, timekeepingId, currentIp, selectedRestaurant, shopIpwanMap, locations, country, selectedShift, reason, otherReason, note, user.keys, fetchWorkShifts, availableShifts, lateAlert, onCloseDrawer]);

  const handleTimekeepingClick = () => {
    if (!isCheckedIn) {
      if (!selectedRestaurant || !selectedShift) {
        message.error('Vui lòng chọn đơn vị chấm công và ca làm việc.');
        return;
      }
      if (availableShifts.length > 0 && ipMatch === false && !reason) {
        message.error('Vui lòng chọn lý do chấm công ngoài IP cho phép.');
        return;
      }
      if (availableShifts.length > 0 && ipMatch === false && reason === 'Khác' && !otherReason) {
        setOtherReasonError('Vui lòng nhập lý do khác.');
        return;
      }
    }
    performTimekeeping();
  };

  const checkLocationPermission = useCallback(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state === 'granted');
      });
    } else if (navigator.geolocation) {
      setLocationPermission(null);
    } else {
      setLocationPermission(false);
    }
  }, []);

  useEffect(() => {
    checkLocationPermission();
    const timer = setInterval(() => setCurrentTime(moment()), 1000);
    return () => clearInterval(timer);
  }, [checkLocationPermission]);

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission(true);
          message.success('Đã cấp quyền truy cập vị trí thành công.');
        },
        (error) => {
          setLocationPermission(false);
          message.error('Quyền bị chặn hoặc lỗi.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationPermission(false);
      message.error('Trình duyệt không hỗ trợ vị trí');
    }
  };

  const reasonOptions = ['Hỗ trợ cửa hàng', 'Lỗi hệ thống', 'Quên chấm công', 'Khác'];

  if (!hasCCPermission) {
    return <NotFoundPage />;
  }

  return (
    <div className={css} style={getStyle()}>
      <title>NISO CHECKLIST | Chấm công</title>
      <Card style={{ width: '100%' }} bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1>{currentTime.format('HH:mm:ss')}</h1>
          <p style={{ textTransform: 'capitalize', marginBottom: 5 }}>{currentTime.format('dddd, DD/MM/YYYY')}</p>
          <Button icon={<MdLocationOn />}>{locations && country ? `${locations} - ${country}` : 'Không lấy được vị trí'}</Button>
        </div>

        {(locationPermission === false || locationPermission === null) && (
          <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
            <Alert message="Cần quyền truy cập vị trí" description="Vui lòng cấp quyền để sử dụng tính năng chấm công." type="info" showIcon banner />
            <Button style={{ marginTop: 15 }} onClick={requestLocationPermission} type="primary">Cho phép</Button>
          </div>
        )}

        {locationPermission === true && (
          <Form layout="vertical">
            <Form.Item label="Chọn đơn vị chấm công" rules={[{ required: true, message: 'Vui lòng chọn đơn vị chấm công' }]} style={{ marginBottom: 0 }}>
              <Select
                style={{ width: '100%', marginBottom: '10px' }}
                placeholder="Chọn chi nhánh"
                showSearch
                filterOption={false}
                onSearch={handleSearch}
                onChange={(value) => setSelectedRestaurant(value)}
                value={selectedRestaurant}
                disabled={isCheckedIn}
                notFoundContent={loading ? <Space><Spin size="small" /> Loading...</Space> : 'Nhập tên nhà hàng...'}
              >
                {options.map((option, index) => (
                  <Option key={index} value={option}>{option}</Option>
                ))}
              </Select>
            </Form.Item>

            {!hideShiftSelection && availableShifts.length > 0 ? (
              <Form.Item label="Chọn ca làm việc" rules={[{ required: true, message: 'Vui lòng chọn ca làm việc' }]} style={{ marginBottom: 0 }}>
                {loadingShifts ? (
                  <Space><Spin size="small" /> Đang tải ca làm việc...</Space>
                ) : (
                  <Select
                    style={{ width: '100%', marginBottom: 10 }}
                    placeholder="Chọn ca làm việc"
                    value={selectedShift ? `${selectedShift.loaiCong}: (${selectedShift.gioVao} - ${selectedShift.gioRa})` : undefined}
                    onChange={(value) => {
                      const shift = availableShifts.find((s) => `${s.loaiCong}: (${s.gioVao} - ${s.gioRa})` === value);
                      if (shift) {
                        setSelectedShift(shift);
                      }
                    }}
                    disabled={isCheckedIn}
                  >
                    {availableShifts.map((shift, index) => (
                      <Option key={index} value={`${shift.loaiCong}: (${shift.gioVao} - ${shift.gioRa})`}>
                        {`${shift.loaiCong}: (${shift.gioVao} - ${shift.gioRa})`}
                      </Option>
                    ))}
                  </Select>
                )}
                {lateAlert && !isCheckedIn && timekeepingStatus === 'out' && (
                  <Alert message={lateAlert} type="warning" showIcon style={{ marginBottom: 10 }} banner />
                )}
              </Form.Item>
            ) : !isCheckedIn && (
              <Alert message="Bạn không có ca làm việc hôm nay" type="warning" style={{ marginBottom: 10 }} banner />
            )}

            {availableShifts.length > 0 && ipMatch === false && !isCheckedIn && (
              <>
                <Alert message="Bạn đang chấm công ngoài IP cho phép" type="warning" style={{ marginBottom: 10 }} />
                <Form.Item label="Lý do chấm công" style={{ marginBottom: 0 }}>
                  <Select
                    style={{ width: '100%', marginBottom: '10px' }}
                    placeholder="Lý do chấm công ngoài IP cho phép"
                    onChange={(value) => {
                      setReason(value);
                      setOtherReasonError('');
                    }}
                    value={reason}
                  >
                    {reasonOptions.map((option) => (
                      <Option key={option} value={option}>{option}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            )}

            {availableShifts.length > 0 && reason === 'Khác' && ipMatch === false && !isCheckedIn && (
              <Form.Item validateStatus={otherReasonError ? 'error' : ''} help={otherReasonError} style={{ marginBottom: 0 }}>
                <TextArea
                  placeholder="Nhập lý do khác..."
                  value={otherReason}
                  onChange={(e) => {
                    setOtherReason(e.target.value);
                    setOtherReasonError('');
                  }}
                  style={{ marginBottom: '10px' }}
                  rows={4}
                />
              </Form.Item>
            )}

            {availableShifts.length > 0 && (
              <Form.Item label="Ghi chú" style={{ marginBottom: 0 }}>
                <TextArea
                  placeholder="Nhập ghi chú (nếu có)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ marginBottom: '10px' }}
                  rows={2}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                onClick={handleTimekeepingClick}
                style={{ width: '100%' }}
                size="large"
                loading={timekeepingLoading}
                disabled={
                  (!isCheckedIn && availableShifts.length === 0) || 
                  !selectedRestaurant ||
                  (!selectedShift && !hideShiftSelection && !isCheckedIn) ||
                  !locations ||
                  !country
                }
              >
                {isCheckedIn ? 'Kết thúc ca' : 'Chấm vào ca'}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
      {NutLichSu && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <NutLichSu />
        </div>
      )}
    </div>
  );
};

export default React.memo(ChamCong);