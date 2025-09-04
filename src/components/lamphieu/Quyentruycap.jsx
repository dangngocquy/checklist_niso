import React from "react";
import Access from '../../assets/noaccess.png'

const Quyentruycap = React.memo(({ t, phanquyen }) => {
    return (
        <div className='line-header-niso' style={{ minHeight: '100vh' }}>
            <title>NISO | Không có quyền truy cập</title>
            <h3>OH NO</h3>
            <p>Bạn không có quyền truy cập vào nội dung này</p>
            <img src={Access} alt="No-Access" className="No-Access"/>
        </div>

    )
});

export default Quyentruycap;