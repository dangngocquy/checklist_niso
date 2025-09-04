import { useState, useEffect, useCallback } from 'react';
import { FloatButton } from 'antd';
import { RxPinTop } from "react-icons/rx";

const BacktoTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    const handleScroll = useCallback(() => {
        const scrollY = window.scrollY;
        const showThreshold = 200;

        setIsVisible(scrollY > showThreshold);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    return (
        <>
            {isVisible && (
                <FloatButton
                    className="back-to-top"
                    shape="circle"
                    type='primary'
                    onClick={scrollToTop}
                    icon={<RxPinTop />}
                    style={{
                        position: 'fixed',
                        bottom: 50,
                        right: 50,
                        zIndex: 1000,
                    }}
                />
            )}
        </>
    );
};

export default BacktoTop;
