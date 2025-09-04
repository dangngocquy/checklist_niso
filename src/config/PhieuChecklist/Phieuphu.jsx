import React from "react";

const Phieuphu = React.memo(({ content, css }) => {
    return (
        <div className={`backgoround-niso-from bg-white border-left-niso flex flex-col ${css}`} style={{marginBottom: '15px'}}>
            {content}
        </div>
    )
})
export default Phieuphu;