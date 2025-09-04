import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { message, Card, Row, Col, Spin } from 'antd';
import vi from '../../assets/language/vn.svg';
import it from '../../assets/language/it.svg';
import us from '../../assets/language/us.svg';
import kh from '../../assets/language/kh.svg';
import jp from '../../assets/language/jp.svg';

const languages = [
    { code: 'vi', name: 'languages.vietnamese', flag: vi },
    { code: 'en', name: 'languages.english', flag: us },
    { code: 'it', name: 'languages.italian', flag: it },
    { code: 'kh', name: 'languages.Campuchia', flag: kh },
    { code: 'jp', name: 'languages.Japanese', flag: jp }
];

const Language = React.memo(({ phanquyen }) => {
    const { t, i18n } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(
        localStorage.getItem('selectedLanguage') || i18n.language
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const langFromStorage = localStorage.getItem('selectedLanguage');
        if (!langFromStorage) {
            setSelectedLanguage('vi');
        }
        setLoading(false);
    }, []);

    const handleLanguageChange = (code) => {
        if (code === selectedLanguage) {
            message.warning(t('Department.input116'));
        } else {
            setSelectedLanguage(code);
            localStorage.setItem('selectedLanguage', code);
            i18n.changeLanguage(code);
            message.success(t('Thongbao.thanhcong'));
        }
    };

    if (loading) {
        return <Spin />;
    }

    return (
        <Row gutter={[16, 16]} style={{ marginTop: 15 }}>
            {languages.map(language => (
                <Col key={language.code} xs={12} sm={8} md={6} lg={6}>
                    <Card
                        style={{
                            cursor: 'pointer',
                            border: selectedLanguage === language.code ? '2px solid var(--main-background)' : '1px solid #f0f0f0',
                            height: '100%',
                        }}
                        onClick={() => handleLanguageChange(language.code)}
                        hoverable
                        cover={
                            <div style={{ padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80px' }}>
                                <img alt={t(language.name)} src={language.flag} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
                            </div>
                        }
                    >
                        <Card.Meta
                            title={t(language.name)}
                            style={{ textAlign: 'center', fontSize: '11px' }}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
});

export default Language;