import React from "react";

const Footers = React.memo(() => {
    return (
        <div className="Mobile__footer">
           <p>©{new Date().getFullYear()} IT Team - NISO Company. All rights reserved.</p>
           <p>4th Floor, 199C Nguyen Van Huong, Thao Dien Ward, Thu Duc City, Ho Chi Minh City, Vietnam</p>
        </div>
    )
});
export default Footers;
