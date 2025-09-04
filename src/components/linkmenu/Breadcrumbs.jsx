import React from 'react';
import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = ({ paths }) => {
    const currentLocation = useLocation();

    return (
        <div style={{ overflowX: 'auto' }} className='mg__size'>
            <Breadcrumb separator=">">
                {paths.map((path, index) => (
                    <Breadcrumb.Item key={index}>
                        {currentLocation.pathname === path.url ? (
                            <span style={{ color: 'black', whiteSpace: 'nowrap' }}>{path.label}</span>
                        ) : (
                            <Link to={path.url} style={{whiteSpace: 'nowrap'}}>{path.label}</Link>
                        )}
                    </Breadcrumb.Item>
                ))}
            </Breadcrumb>
        </div>
    );
};

export default Breadcrumbs;
