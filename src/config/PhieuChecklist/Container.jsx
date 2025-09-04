import React from "react";

const Container = React.memo(({ content, css }) => {
  return (
    <div className={`box-send ${css}`} style={{ marginBottom: '15px' }}>
      {content}
    </div>
  );
});

export default Container;