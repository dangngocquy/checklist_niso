import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../linkmenu/Breadcrumbs";
import { Profiles } from "../../linkmenu/Data";
import Notification from "../../Notification";
import sha256 from 'js-sha256';
import axios from 'axios';
import Loadingtable from "../../loading/Loadingtable";

const Baomat = React.memo(({ t, keys, username }) => {
    const settingsWithTranslation = Profiles(t, keys);
    const [token, setToken] = useState(() => generateTokenFromKeys(keys));
    const [showNotification, setShowNotification] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const [cauhoi, setCauhoi] = useState("");
    const [giaoviecList, setGiaoviecList] = useState([]);
    const [cautraloi, setCautraloi] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const newToken = generateTokenFromKeys(keys);
        setToken(newToken);
    }, [keys]);

    function generateTokenFromKeys(keys) {
        return sha256(keys).toUpperCase();
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(token)
            .then(() => setCopySuccess(<Notification type="success" content={t('Department.input99')} onClose={() => setShowNotification(null)} />))
            .catch((err) => console.error('Failed to copy:', err));
    };

    useEffect(() => {
        axios.get('/baomat/all')
            .then(response => {
                setGiaoviecList(response.data.giaoviecList);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching baomat:', error);
                setLoading(false);
            });
    }, []);

    const handleConfirmation = () => {
        if (!cauhoi || !cautraloi) {
            setCopySuccess(<Notification type="warning" content={t('Department.input58')} onClose={() => setShowNotification(null)} />);
            return;
        }
        const questionExists = settingsWithTranslation.some(profile => profile.question === cauhoi);
        if (questionExists) {
            setCopySuccess(<Notification type="warning" content="Câu hỏi đã tồn tại, vui lòng nhập câu hỏi khác !" onClose={() => setShowNotification(null)} />);
            return;
        }

        axios.post('/baomat/check', {
            cauhoi: cauhoi,
            cautraloi: cautraloi,
            tokenID: token,
            idkeys: keys,
            account: username
        })
            .then(response => {
                setCopySuccess(<Notification type="success" content="Thêm thành công !" onClose={() => setShowNotification(null)} />);
                console.log(response.data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };


    return (
        <div className='line-header-niso' style={{ minHeight: '100vh' }}>
            <title>NISO | {t('Department.input97')}</title>
            <div className='bg-white backgoround-niso-from dark:bg-slate-900' style={{ maxWidth: '1800px', margin: '0 auto', marginBottom: '15px' }}>
                <span className='flex-phanqquyen-niso'>
                    <h3 className='dark:text-white font-bold'>
                        {t('ViewDocs.input16')}
                    </h3>
                </span>
                <Breadcrumbs paths={settingsWithTranslation} />
            </div>

            <div className='bg-white backgoround-niso-from dark:bg-slate-900' style={{ maxWidth: '1800px', margin: '0 auto' }}>
                <h3 className='dark:text-white font-bold'>{t('Department.input98')}</h3>
                <div className="grid1-niso mt-3">
                    {loading ? (
                        <Loadingtable heightl="336px" />
                    ) : (
                        giaoviecList.length === 0 ? (
                            <table id="customers" style={{ textAlign: 'center' }} className='text-sm dark:text-white'>
                                <thead>
                                    <tr>
                                        <th>{t('Input.input7')}</th>
                                        <th>Câu hỏi bảo mật</th>
                                        <th>Đáp án</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan="3" className="text-center">
                                            Không tìm thấy câu hỏi bảo mật nào !
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <table id="customers" className='text-sm dark:text-white'>
                                <thead>
                                    <tr>
                                        <th>{t('Input.input7')}</th>
                                        <th>Câu hỏi bảo mật</th>
                                        <th>Đáp án</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {giaoviecList.map((giaoviec, index) => (
                                        <tr key={giaoviec.id}>
                                            <td>{index + 1}</td>
                                            <td>{giaoviec.cauhoi}</td>
                                            <td>{giaoviec.cautraloi}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}
                    <div className="flex-table-niso-2">
                        <h3 className="dark:text-white font-bold b">Thêm câu hỏi bảo mật và chép mã dưới đây để đặt lại khi quên mật khẩu</h3>
                        <div className=" flex flex-col">
                            <label className="grid-account-admin-niso">
                                <p className="text-sm">Tạo câu hỏi</p>
                                <input type="text" className="question-container-niso-question" placeholder="Thêm câu hỏi bảo mật" value={cauhoi} onChange={(e) => setCauhoi(e.target.value)} />
                            </label>
                            <label className="grid-account-admin-niso">
                                <p className="text-sm">Tạo câu trả lời</p>
                                <input type="text" className="question-container-niso-question" placeholder="Thêm câu trả lời" value={cautraloi} onChange={(e) => setCautraloi(e.target.value)} />
                            </label>
                            <label className="grid-account-admin-niso">
                                <p className="text-sm"><span className="font-bold">Token</span><i className="text-sm"> (Không cung cấp mã này cho bất kì ai)</i></p>
                                <div className="flex gap-3">
                                    <input value={token} placeholder={token} className="question-container-niso-question" readOnly />
                                    <button onClick={copyToClipboard}>Sao chép token</button>
                                </div>
                            </label>
                            <div className="mt-3">
                                <button onClick={handleConfirmation}>Xác nhận</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {copySuccess}
            {showNotification}
        </div>
    );
});

export default Baomat;
