import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';

const Back = React.memo(({name}) => {
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate(-1);
    };
    return(
        <Button type='primary' onClick={handleGoBack}>{name}</Button>
    )
});

export default Back;