import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import Notification from "./Notification";
import Logo from '../assets/Logo.svg';
import { Link } from "react-router-dom";

const Quenmatkhau = React.memo(({ t }) => {
    const [giaoviecList, setGiaoviecList] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [username, setUsername] = useState('');
    const [showNotification, setShowNotification] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        axios.get('/baomat/all')
            .then(response => {
                setGiaoviecList(response.data.giaoviecList);
            })
            .catch(error => {
                console.error('Error fetching baomat:', error);
            });
    }, []);

    const matchedIndex = giaoviecList.findIndex(item => item.tokenID.toLowerCase() === token.toLowerCase());
    const handleValidation = () => {

        if (matchedIndex !== -1 &&
            giaoviecList[matchedIndex].tokenID.toLowerCase() === token.toLowerCase() &&
            giaoviecList[matchedIndex].cautraloi.toLowerCase() === answer.toLowerCase() &&
            giaoviecList[matchedIndex].account === username &&
            selectedQuestion === giaoviecList[matchedIndex].cauhoi) {
            setIsSuccess(true);
        } else {
            setCopySuccess(<Notification type="warning" content={t('Department.input100')} onClose={() => setShowNotification(null)} />)
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
    
        if (newPassword !== confirmPassword) {
            setCopySuccess(<Notification type="warning" content={t('Profile.input7')} onClose={() => setShowNotification(null)} />)
            return;
        }
    
        if (!newPassword || !confirmPassword) {
            setCopySuccess(<Notification type="warning" content={t('Department.input58')} onClose={() => setShowNotification(null)} />)
            return;
        }
    
        if (matchedIndex !== -1) {
            try {
                const response = await axios.put(`/users/changepassword/${giaoviecList[matchedIndex].idkeys}`, {
                    password: newPassword,
                });
                console.error(response.data);
                setCopySuccess(<Notification type="success" content="Thay đổi mật khẩu thành công !" onClose={() => setShowNotification(null)} />)
                navigate('/login');
            } catch (error) {
                console.error(error);
                alert('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        }
    };
    
    if (isSuccess) {
        return <Thanhcong t={t} 
        newPassword={newPassword} 
        setNewPassword={setNewPassword} 
        confirmPassword={confirmPassword} 
        setConfirmPassword={setConfirmPassword} 
        matchedIndex={matchedIndex}
        handleChangePassword={handleChangePassword}
        />;
    }

    return (
        <div className="line-header-niso">
            <div style={{ minHeight: '100vh', maxWidth: '800px', margin: '0 auto' }}>
                <title>NISO | Quên mật khẩu</title>
                <div className='bg-white backgoround-niso-from dark:bg-slate-900' style={{ maxWidth: '1800px', margin: '0 auto', marginBottom: '15px' }}>
                    <Link to="/login" className="flex items-center">
                        <img src={Logo} alt="Logo" width={80} />
                        <b>NISO CHECKLIST</b>
                    </Link>
                    <span className='flex flex-col'>
                    <label className="grid-account-admin-niso">
                            <p className="text-sm">Nhập tên tài khoản</p>
                            <input
                                type="text"
                                className="question-container-niso-question"
                                placeholder="Tên tài khoản"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </label>
                        <label className="grid-account-admin-niso">
                            <p className="text-sm">Lựa chọn câu hỏi bảo mật</p>
                            <select
                                className="text-sm select-option-niso uppercase w-full"
                                value={selectedQuestion}
                                onChange={(e) => setSelectedQuestion(e.target.value)}
                            >
                                <option>Chọn câu hỏi bảo mật</option>
                                {giaoviecList.map((item, index) => (
                                    <option key={index}>{item.cauhoi}</option>
                                ))}
                            </select>
                        </label>
                        <label className="grid-account-admin-niso">
                            <p className="text-sm">Nhập câu trả lời</p>
                            <input
                                type="text"
                                className="question-container-niso-question"
                                placeholder="Câu trả lời"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                            />
                        </label>
                        <label className="grid-account-admin-niso">
                            <p className="text-sm">Nhập mã token</p>
                            <input
                                type="password"
                                className="question-container-niso-question"
                                placeholder="Mã token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </label>
                    </span>
                    <button className="mt-3" onClick={handleValidation}>Tiếp tục</button>
                </div>
            </div>
            {showNotification}
            {copySuccess}
        </div>
    );
});

const Thanhcong = ({ t, newPassword, setNewPassword, confirmPassword, setConfirmPassword, handleChangePassword }) => {
    return (
        <div className="line-header-niso">
            <div style={{ minHeight: '100vh', maxWidth: '800px', margin: '0 auto' }}>
                <title>NISO | Thay đổi mật khẩu</title>
                <form onSubmit={handleChangePassword} className='bg-white backgoround-niso-from dark:bg-slate-900' style={{ maxWidth: '1800px', margin: '0 auto', marginBottom: '15px' }}>
                    <label className="grid-account-admin-niso">
                        <p className="text-sm">Nhập mật khẩu mới</p>
                        <input
                            type="password"
                            className="question-container-niso-question"
                            placeholder="Nhập mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </label>
                    <label className="grid-account-admin-niso">
                        <p className="text-sm">Xác nhận mật khẩu mới</p>
                        <input
                            type="password"
                            className="question-container-niso-question"
                            placeholder="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </label>
                    <button className="mt-3">Xác nhận</button>
                </form>
            </div>
        </div>
    );
};

export default Quenmatkhau;
