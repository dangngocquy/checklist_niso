import React from "react";
import { CiLock } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';
import { IoBookmarkOutline, IoBookmark } from "react-icons/io5";
import { message, Badge } from "antd";

const Boxchecklist = React.memo(({ t, hinhanh, title, lock, thongbaomain, phongban, time, nguoitaophieu, code, xacthuc, keys, functionFalse, functionTrue }) => {
    const navigate = useNavigate();

    const handleChecklist = (docID) => {
        if (lock) {
            if (typeof thongbaomain === 'function') {
                message.warning(t('Department.input89'));
            }
        } else {
            navigate(docID);
        }
    };

    const Content = (
        <div className='box-link-docs-niso'>
            <div rel="preload" onClick={() => handleChecklist(`/auth/docs/views/${code}`)} className='box-link-docs-nisos'>
                <span style={{ display: 'flex', gap: '15px' }}>
                    <img src={hinhanh} alt='File' className='imgFile' />
                    <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <h3 style={{ fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '8px', color: '#8a6a16' }} className="hide_niso_home">
                                {title}
                            </h3>
                        </div>
                        <span style={{textOverflow: 'ellipsis', fontSize: '11px', overflow: 'hidden', whiteSpace: 'nowrap', color: '#ae8f3d'}} className="hide_niso_home_name">{nguoitaophieu}</span>
                    </span>
                </span>
                <span className='m' style={{ textTransform: 'uppercase', color: '#ae8f3d' }}>
                    {t('Header.header3')} {phongban}
                </span>
                <span className='m' style={{color: '#ae8f3d'}}>
                    {t('Phanquyen.input36')} {time}
                </span>
            </div>
            {Array.isArray(xacthuc) && xacthuc.some(key => key.account === keys && key.save) ? (
                <span onClick={functionFalse}>
                    <IoBookmark size={25} className="incon-save-niso"/>
                </span>
            ) : (
                <span onClick={functionTrue}>
                    <IoBookmarkOutline size={25} className="incon-save-niso"/>
                </span>
            )}
        </div>
    );

    return (
        <React.Fragment>
            {lock ? (
                <Badge.Ribbon text={<div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CiLock /> {t('Department.input63')}</div>} color="red">
                    {Content}
                </Badge.Ribbon>
            ) : (
                Content
            )}
        </React.Fragment>
    );
});

export default Boxchecklist;
