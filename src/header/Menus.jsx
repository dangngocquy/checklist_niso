import React from "react";
import { NavLink } from "react-router-dom";
import { CiCirclePlus, CiStickyNote } from "react-icons/ci";
import { IoBarChartOutline } from "react-icons/io5";
import {  AiOutlineContainer, AiOutlineDashboard } from "react-icons/ai";
import { FiMoreHorizontal } from "react-icons/fi";

const Menus = React.memo(({ user, t, menuData }) => {
    const renderMenuItems = () => {
        return menuData.map(item => {
            if (item.key === "dashboard") {
                return (
                    <NavLink key={item.key} activeclassname="active" rel="preload" to={item.link} className="tab" style={{ background: 'none' }}>
                        <AiOutlineDashboard size={20}/>
                        <span className="iicon__menu__niso">{t(item.label)}</span>
                    </NavLink>
                );
            }
            if (item.key === "home") {
                return (
                    <NavLink key={item.key} activeclassname="active" rel="preload" to={item.link} className="tab" style={{ background: 'none' }}>
                        <AiOutlineContainer size={20}/>
                        <span className="iicon__menu__niso">{t(item.label)}</span>
                    </NavLink>
                );
            }
            if (item.key === "create" && ((user && user.bophan && user.bophan.toLowerCase()) || user.phanquyen === true)) {
                return (
                    <NavLink key={item.key} activeclassname="active" rel="preload" to={item.link} className="tab" style={{ background: 'none' }}>
                        <CiCirclePlus size={20} />
                        <span className="iicon__menu__niso">{t(item.label)}</span>
                    </NavLink>
                );
            }
            if (item.key === "submenu2") {
                return (
                    <NavLink key="feedback-statistics" activeclassname="active" rel="preload" to="/auth/docs/list/view/danh-sach-phan-hoi/phan-hoi-cua-ban" className="tab" style={{ background: 'none' }}>
                        <IoBarChartOutline size={20} />
                        <span className="iicon__menu__niso">Phản hồi</span>
                    </NavLink>
                );
            }
            if (item.key === "submenu1") {
                return (
                    <NavLink key="survey-management" activeclassname="active" rel="preload" to="/auth/docs/list/danh-sach-check-list" className="tab" style={{ background: 'none' }}>
                        <CiStickyNote size={20} />
                        <span className="iicon__menu__niso">Danh sách</span>
                    </NavLink>
                );
            }
            return null;
        });
    };

    return (
        <div>
            <div className="list-mb menu-mb">
                {renderMenuItems()}
                <NavLink activeclassname="active" rel="preload" to={`/auth/docs/them`} className="tab" style={{ background: 'none' }}>
                    <FiMoreHorizontal size={20} />
                    <span className="iicon__menu__niso">{t('Input.input20')}</span>
                </NavLink>
            </div>
        </div>
    );
});

export default Menus;