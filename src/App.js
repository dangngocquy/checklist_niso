import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message, Modal, Button, ConfigProvider } from 'antd';
import './App.scss';
import NutLichSu from './components/chamcong/NutLichSu';
import LoadingProgress from './components/loading/LoadingProgress';
import useDeviceInfo from './hook/useDeviceInfo';
import useLocationInfo from './hook/useLocationInfo';
import usePermission from './hook/usePermission';
import { NotificationProvider } from './notificationContext';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const Login = React.lazy(() => import('./components/Login'));
const JointQuiz = React.lazy(() => import('./components/NisoQuiz/JointQuiz'));
const QuizContainer = React.lazy(() => import('./components/NisoQuiz/QuizContainer'));
const CreateQyiz = React.lazy(() => import('./components/NisoQuiz/CreateQyiz'));
const ThongkeArchive = React.lazy(() => import('./components/loading/report/ThongkeArchive'));
const HocTap = React.lazy(() => import('./components/Study/HocTap'));
const QuanLyLichHoc = React.lazy(() => import('./components/Study/QuanLyLichHoc'));
const NotificationsPage = React.lazy(() => import('./header/NotificationsPage'));
const CreateThongbao = React.lazy(() => import('./header/CreateThongbao'));
const HeaderAsset = React.lazy(() => import('./components/assetList/HeaderAsset'));
const ThanhLyTaiSan = React.lazy(() => import('./components/assetList/ThanhLyTaiSan'));
const Baohanh = React.lazy(() => import('./components/assetList/Baohanh'));
const KiemKe = React.lazy(() => import('./components/assetList/KiemKe'));
const Reports = React.lazy(() => import('./components/assetList/Reports'));
const ListCong = React.lazy(() => import('./components/chamcong/ListCong'));
const Dashboard = React.lazy(() => import('./components/home/Dashboard'));
const HeaderChamCong = React.lazy(() => import('./components/chamcong/HeaderChamCong'));
const NotFoundPage = React.lazy(() => import('./components/NotFoundPage'));
const Home = React.lazy(() => import('./components/home/Home'));
const XuLyPhanHoi = React.lazy(() => import('./components/Phanhoi/XuLyPhanHoi'));
const Taocong = React.lazy(() => import('./components/chamcong/TaoCong'));
const ViewXuLy = React.lazy(() => import('./components/xemphieu/ViewXuLy'));
const ListXuLy = React.lazy(() => import('./components/Phanhoi/ListXuLy'));
const Lichsuchamcong = React.lazy(() => import('./components/chamcong/Lichsuchamcong'));
const Quantri = React.lazy(() => import('./components/phanquyen/Quantri'));
const Caidat = React.lazy(() => import('./header/Option'));
const Them = React.lazy(() => import('./header/Them'));
const ChamCong = React.lazy(() => import('./components/chamcong/ChamCong'));
const Edit = React.lazy(() => import('./components/Edit/Edit'));
const Dashboards = React.lazy(() => import('./components/assetList/Dashboard'));
const Asset = React.lazy(() => import('./components/assetList/Asset'));
const Docs = React.lazy(() => import('./components/lamphieu/Docs'));
const LichsuLogin = React.lazy(() => import('./components/thongtincanhan/LichsuLogin'));
const Container = React.lazy(() => import('./components/Container'));
const BanNhap = React.lazy(() => import('./components/BanNhap'));
const ChecklistSave = React.lazy(() => import('./components/danhsachsave/ChecklistSave'));
const Report = React.lazy(() => import('./components/loading/report/listReport/Report'));
const ReportViewer = React.lazy(() => import('./components/loading/report/listReport/ReportViewer'));
const HeaderPhanquyen = React.lazy(() => import('./components/phanquyen/HeaderPhanquyen'));
const Phanquyen = React.lazy(() => import('./components/phanquyen/Phanquyen'));
const Create = React.lazy(() => import('./components/taochecklist/Create'));
const Profile = React.lazy(() => import('./components/thongtincanhan/Profile'));
const HeaderViews = React.lazy(() => import('./components/manageList/manageChecklist/HeaderViews'));
const Account = React.lazy(() => import('./components/phanquyen/taikhoan/Account'));
const Chinhanh = React.lazy(() => import('./components/manageList/manageBranch/Chinhanh'));
const ViewsChecklist = React.lazy(() => import('./components/manageList/manageChecklist/ViewsChecklist'));
const AdminChecklist = React.lazy(() => import('./components/manageList/manageChecklist/AdminChecklist'));
const Department = React.lazy(() => import('./components/manageList/manageBophan/Department'));
const ViewUser = React.lazy(() => import('./components/xemphieu/ViewUser'));
const ListViews = React.lazy(() => import('./components/Phanhoi/ListViews'));
const ListViewsAll = React.lazy(() => import('./components/Phanhoi/ListViewsAll'));
const HeaderListViews = React.lazy(() => import('./components/Phanhoi/HeaderListViews'));
const StartQuiz = React.lazy(() => import('./components/NisoQuiz/StartQuiz'));

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [intendedUrl, setIntendedUrl] = useState(null);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [tabCounts, setTabCounts] = useState({ all: 0 });

  const { deviceInfo, browser } = useDeviceInfo();
  const { locations, country } = useLocationInfo();

  const {
    initializePermission,
    clearPermissionsCache,
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
    hasPointPermission,
    hastCreatenotiPermission,
  } = usePermission();

  useEffect(() => {
    if (user) {
      initializePermission(user);
    }
  }, [user, initializePermission]);

  const updateTabCounts = (newCounts) => {
    setTabCounts(newCounts);
  };

  const handleLogout = useCallback(() => {
    clearPermissionsCache(); // Xóa cache quyền trước khi đăng xuất
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    message.success(t('Department.input153'));
  }, [navigate, t, clearPermissionsCache]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const savedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
      if (savedUser) {
        const loginTime = new Date(savedUser.loginTime);
        const currentTime = new Date();
        const timeDiff = (currentTime - loginTime) / 1000;
        const sessionDuration = 8 * 3600;

        if (timeDiff >= sessionDuration) {
          handleLogout();
        } else {
          setUser(savedUser);
          const remainingTime = sessionDuration - timeDiff;
          setTimeRemaining(remainingTime);
          if (remainingTime <= 3600 && remainingTime > 3599) {
            setWarningMessage(t('Department.input377'));
            setShowWarningModal(true);
          } else if (remainingTime <= 1800 && remainingTime > 1799) {
            setWarningMessage(t('Department.input378'));
            setShowWarningModal(true);
          } else if (remainingTime <= 900 && remainingTime > 899) {
            setWarningMessage(t('Department.input379'));
            setShowWarningModal(true);
          }
        }
      }
      setIsLoading(false);

      // Kiểm tra nếu không có user và không phải route công khai thì yêu cầu đăng nhập
      if (!savedUser && location.pathname !== '/login') {
        const isPublicRoute = location.pathname.startsWith('/auth/docs/form/') || location.pathname === '/minigame' || location.pathname.startsWith('/minigame?');
        if (!isPublicRoute) {
          setIntendedUrl(location.pathname + location.search);
          message.warning('Vui lòng đăng nhập để tiếp tục!');
          navigate('/login');
        }
      }
    };

    checkLoginStatus();
    const interval = setInterval(checkLoginStatus, 1000);

    return () => clearInterval(interval);
  }, [handleLogout, t, location.pathname, location.search, navigate]);

  const canAccessListXuLy = useCallback(() => {
    if (!user || !user.chinhanh) return false;
    return true;
  }, [user]);

  const handleLogin = useCallback((userData) => {
    const loginTime = new Date().toISOString();
    const userWithLoginTime = { ...userData, loginTime };
    const storage = userData.keepLoggedIn ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(userWithLoginTime));
    setUser(userWithLoginTime);

    const state = location.state || {};
    const redirectTo = state.intendedUrl || intendedUrl || '/auth/docs/dashboard';
    navigate(redirectTo);
    setIntendedUrl(null);
  }, [navigate, intendedUrl, location.state]);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      if (progress > 100) {
        clearInterval(interval);
      } else {
        setLoadingProgress(progress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <LoadingProgress loadingProgress={loadingProgress} />;
  }

  const getStyle = () => ({
    padding: 20,
    margin: '0 auto',
    maxWidth: 400,
  });


  return (
    <Suspense fallback={<LoadingProgress loadingProgress={loadingProgress} />}>
      <NotificationProvider user={user}>
        <Modal
          title={t('Department.input380')}
          visible={showWarningModal}
          onOk={() => setShowWarningModal(false)}
          closeIcon={null}
          bodyStyle={{
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f6f6f6',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          titleStyle={{
            borderBottom: '1px solid #e8e8e8',
            paddingBottom: '12px',
            color: '#FF4D4F',
            fontWeight: 'bold'
          }}
          footer={[
            <Button
              key="ok"
              type="primary"
              danger
              block
              onClick={() => setShowWarningModal(false)}
            >
              OK
            </Button>
          ]}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <ExclamationCircleOutlined
              style={{
                fontSize: '34px',
                color: '#FAAD14',
              }}
            />
          </div>
          <p style={{
            fontSize: '14px',
            color: 'rgba(0,0,0,0.65)',
            lineHeight: '1.5'
          }}>
            {warningMessage}
          </p>
        </Modal>

        <Routes>
        <Route path="/minigame" element={<JointQuiz />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/auth/docs/dashboard" />
              ) : (
                <Login
                  onLoginSuccess={handleLogin}
                  t={t}
                  deviceInfo={deviceInfo}
                  browser={browser}
                  country={country}
                  locations={locations}
                  user={user}
                  initializePermission={initializePermission}
                />
              )
            }
          />
          <Route path="niso-quiz/view/:quizId" element={<StartQuiz user={user} t={t} />} />
          <Route
            path="/auth/docs/*"
            element={
              user ? (
                <Container
                  user={user}
                  t={t}
                  handleLogout={handleLogout}
                  timeRemaining={timeRemaining}
                  hasCreatePermission={hasCreatePermission}
                  hasCCPermission={hasCCPermission}
                  hastcvqclvPermission={hastcvqclvPermission}
                  hasquanlyTSPermission={hasquanlyTSPermission}
                  hastKiemKePermission={hastKiemKePermission}
                  hastXoaTSPermission={hastXoaTSPermission}
                  hasxlphPermission={hasxlphPermission}
                  hastCreatenotiPermission={hastCreatenotiPermission}
                />
              ) : null
            }
          >
            <Route path="form/views/:id" element={<ViewUser user={user} hasPointPermission={hasPointPermission} t={t} isViewUser={true} hasxemPermission={hasxemPermission} hasxlphPermission={hasxlphPermission} />} />
            <Route path="form/:id" element={<Docs user={user} t={t} isViewUser={false} hasEditPermission={hasEditPermission} />} />
            <Route path="form/views/:documentId/:questionId" element={<ViewXuLy user={user} t={t} hasxemPermission={hasxemPermission} hasxlphPermission={hasxlphPermission} />} />
            <Route path="home" element={user ? <Home user={user} t={t} handleLogout={handleLogout} hasCreatePermission={hasCreatePermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="create" element={user ? <Create user={user} t={t} hasCreatePermission={hasCreatePermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="hoc-tap" element={user ? <HocTap user={user} t={t} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="quan-ly-lich-hoc" element={user ? <QuanLyLichHoc user={user} t={t} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="profile/:keys" element={user ? <Profile user={user} t={t} handleLogout={handleLogout} hasCCPermission={hasCCPermission} /> : <Navigate to="/login" state={{ from: location }} replace />}>
              <Route path="personal-info" element={<Profile user={user} t={t} handleLogout={handleLogout} hasCCPermission={hasCCPermission} />} />
              <Route path="security" element={<Profile user={user} t={t} handleLogout={handleLogout} hasCCPermission={hasCCPermission} />} />
              <Route index element={<Navigate to="personal-info" replace />} />
            </Route>
            <Route path="dashboard" element={user ? <Dashboard user={user} t={t} locations={locations} country={country} hasCCPermission={hasCCPermission} hasxlphPermission={hasxlphPermission} getStyle={getStyle} NutLichSu={NutLichSu} css="layout__container2" hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            {user && user.phanquyen === true && <Route path="account" element={<Account user={user} t={t} />} />}
            {user && user.phanquyen === true && <Route path="server" element={<Quantri user={user} t={t} />} />}
            {user && user.phanquyen === true && <Route path="danh-sach-cua-hang" element={<Chinhanh user={user} t={t} />} />}
            <Route path="list-draft-checklist" element={user ? <BanNhap user={user} t={t} hasCreatePermission={hasCreatePermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="settings" element={user ? <Caidat user={user} t={t} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="them" element={user ? <Them user={user} t={t} hasCreatePermission={hasCreatePermission} hasxlphPermission={hasxlphPermission} hasCCPermission={hasCCPermission} hastcvqclvPermission={hastcvqclvPermission} handleLogout={handleLogout} hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            {user && user.phanquyen === true && <Route path="danh-sach-phong-ban" element={<Department user={user} t={t} />} />}
            <Route path="lich-su-cham-cong" element={user ? <Lichsuchamcong user={user} t={t} hasCCPermission={hasCCPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="cham-lam-viec" element={user ? <ChamCong user={user} t={t} locations={locations} country={country} getStyle={getStyle} NutLichSu={NutLichSu} css="layout_main_niso" hasCCPermission={hasCCPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="form/edit/:id" element={user ? <Edit user={user} t={t} hasEditPermission={hasEditPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="report" element={user ? <Report user={user} t={t} hasReportPermission={hasReportPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="thong-ke" element={user ? <ThongkeArchive user={user} t={t} hasxemPermission={hasxemPermission} hasxlphPermission={hasxlphPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="cham-cong/*" element={user ? <HeaderChamCong user={user} t={t} hastcvqclvPermission={hastcvqclvPermission} /> : <Navigate to="/login" state={{ from: location }} replace />}>
              <Route path="danh-sach-cong" element={<ListCong user={user} t={t} hastcvqclvPermission={hastcvqclvPermission} />} />
              <Route path="tao-cong" element={<Taocong user={user} t={t} hastcvqclvPermission={hastcvqclvPermission} />} />
            </Route>
            {canAccessListXuLy() && <Route path="xu-ly-danh-sach" element={<ListXuLy user={user} t={t} />} />}
            <Route path="danh-sach-da-luu" element={user ? <ChecklistSave user={user} t={t} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="lich-su-dang-nhap" element={user ? <LichsuLogin user={user} t={t} deviceInfo={deviceInfo} browser={browser} country={country} locations={locations} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="views/:keys" element={user ? <ReportViewer user={user} t={t} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="dashboard-tai-san" element={user ? <Dashboards user={user} t={t} hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="danh-sach-tai-san/*" element={user ? <HeaderAsset user={user} t={t} hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} /> : <Navigate to="/login" state={{ from: location }} replace />}>
              <Route path="list-asset" element={<Asset user={user} t={t} hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} />} />
              <Route path="asset-ton" element={<KiemKe user={user} t={t} hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} />} />
              <Route path="bao-hanh" element={<Baohanh user={user} t={t} hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} />} />
              <Route path="thanh-ly" element={<ThanhLyTaiSan user={user} t={t} hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} />} />
              <Route path="report" element={<Reports user={user} t={t} hasquanlyTSPermission={hasquanlyTSPermission} hastKiemKePermission={hastKiemKePermission} hastXoaTSPermission={hastXoaTSPermission} />} />
              <Route index element={<Navigate to="list-asset" replace />} />
              <Route path="*" element={<NotFoundPage t={t} />} />
            </Route>
            {user && user.phanquyen === true && (
              <Route path="phan-quyen/*" element={<HeaderPhanquyen user={user} t={t} />}>
                <Route path="account" element={<Phanquyen user={user} t={t} activeTab="account" />} />
                <Route path="department" element={<Phanquyen user={user} t={t} activeTab="department" />} />
                <Route path="restaurant" element={<Phanquyen user={user} t={t} activeTab="restaurant" />} />
                <Route path="module" element={<Phanquyen user={user} t={t} activeTab="module" />} />
                <Route index element={<Navigate to="account" replace />} />
                <Route path="*" element={<NotFoundPage t={t} />} />
              </Route>
            )}
            <Route path="niso-quiz" element={<QuizContainer user={user} t={t} />} />
            <Route path="niso-quiz/create" element={<CreateQyiz user={user} t={t} />} />
            <Route path="notifications" element={user ? <NotificationsPage user={user} t={t} hastCreatenotiPermission={hastCreatenotiPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="create-noti" element={user ? <CreateThongbao user={user} t={t} hastCreatenotiPermission={hastCreatenotiPermission} /> : <Navigate to="/login" state={{ from: location }} replace />} />
            <Route path="list/*" element={user ? <HeaderViews user={user} t={t} /> : <Navigate to="/login" state={{ from: location }} replace />}>
              <Route path="danh-sach-check-list" element={<ViewsChecklist user={user} t={t} hasCreatePermission={hasCreatePermission} dlxlphPermission={dlxlphPermission} hasPointPermission={hasPointPermission} hasEditPermission={hasEditPermission} />} />
              {user && user.phanquyen === true && <Route path="tat-ca-check-list" element={<AdminChecklist user={user} t={t} />} />}
            </Route>
            <Route path="list/view/*" element={user ? <HeaderListViews user={user} t={t} tabCounts={tabCounts} hasxlphPermission={hasxlphPermission} /> : <Navigate to="/login" state={{ from: location }} replace />}>
              <Route path="danh-sach-phan-hoi/phan-hoi-cua-ban" element={<ListViews user={user} t={t} hasxemPermission={hasxemPermission} xoaPermission={xoaPermission} hasxlphPermission={hasxlphPermission} ganPhanHoiPermission={ganPhanHoiPermission} defaultTab="personal" />} />
              <Route path="danh-sach-phan-hoi/phan-hoi-duoc-cap" element={<ListViews user={user} t={t} hasxemPermission={hasxemPermission} xoaPermission={xoaPermission} hasxlphPermission={hasxlphPermission} ganPhanHoiPermission={ganPhanHoiPermission} defaultTab="assigned" />} />
              <Route path="danh-sach-phan-hoi/phieu-cho-xu-ly/:tab" element={<ListViews user={user} t={t} hasxemPermission={hasxemPermission} xoaPermission={xoaPermission} hasxlphPermission={hasxlphPermission} ganPhanHoiPermission={ganPhanHoiPermission} defaultTab="xu-ly-phan-hoi-user" />} />
              {user && user.phanquyen === true && (
                <Route
                  path="tat-ca-phan-hoi"
                  element={
                    <ListViewsAll
                      user={user}
                      t={t}
                      updateTabCounts={updateTabCounts}
                      hasxemPermission={hasxemPermission}
                      hasxlphPermission={hasxlphPermission}
                    />
                  }
                />
              )}


              {user && (user.phanquyen === 'Xử lý yêu cầu' || user.phanquyen === true) && (
                <Route
                  path="xu-ly-phan-hoi/*"
                  element={
                    <XuLyPhanHoi
                      user={user}
                      t={t}
                      hasxemPermission={hasxemPermission}
                      hasxlphPermission={hasxlphPermission}
                    />
                  }
                >
                  <Route
                    path=":tab"
                    element={
                      <XuLyPhanHoi
                        user={user}
                        t={t}
                        hasxemPermission={hasxemPermission}
                        hasxlphPermission={hasxlphPermission}
                      />
                    }
                  />
                  <Route
                    index
                    element={<Navigate to="assigned" replace />}
                  />
                </Route>
              )}
            </Route>
            <Route path="*" element={<NotFoundPage t={t} />} />
          </Route>
          <Route path="*" element={<NotFoundPage t={t} />} />
        </Routes>
      </NotificationProvider>
    </Suspense>
  );
};

const AppWrapper = () => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#ae8f3d',
        borderRadius: 6,
      },
      components: {
        Button: {
          colorLink: '#8f732b',
          colorLinkHover: '#ae8f3d',
          colorLinkActive: '#ae8f3d',
          colorPrimary: "#ae8f3d",
          colorPrimaryHover: "#8a6a16",
        },
        Menu: {
          colorItemBg: '#ffffff',
          colorItemText: '#ae8f3d',
          colorItemTextHover: '#8f732b',
          colorItemSelectedBg: '#f5f5f5',
        },
        Layout: {
          siderTriggerColor: "#ae8f3d",
          siderTriggerBackground: "#ae8f3d",
        },
        Input: {
          colorBorder: '#ae8f3d',
          colorPlaceholder: '#ae8f3d',
        },
        Checkbox: {
          colorPrimary: '#ae8f3d',
          element: {
            width: '100%',
          },
        },
      },
    }}
  >
    <Router>
      <App />
    </Router>
  </ConfigProvider>
);

export default AppWrapper;