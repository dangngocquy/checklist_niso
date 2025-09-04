import React from "react";

const Cauhoi = React.memo(({ content, css }) => {
    return (
        <div className={`box-send ${css}`} style={{marginBottom: '15px'}}>
            {content}
        </div>
    )
})
export default Cauhoi;