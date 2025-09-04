import React from "react";

const Tieudephieu = React.memo(({ content, css }) => {
    return (
        <div className={`backgoround-niso-from bg-white niso-box-titles ${css}`} style={{marginBottom: '15px'}}>
            {content}
        </div>
    )
})
export default Tieudephieu;