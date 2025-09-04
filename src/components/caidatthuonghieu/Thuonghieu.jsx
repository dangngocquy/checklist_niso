import React from "react";
import { Settings } from "../linkmenu/Data";
import Breadcrumbs from "../linkmenu/Breadcrumbs";
import { Card } from "antd";

const Phieuin = React.memo(({ t, phanquyen }) => {
    const settingsWithTranslation = Settings(t, phanquyen);
    return (
        <>
            <title>NISO | {t('Department.input76')}</title>
            <Breadcrumbs paths={settingsWithTranslation} />
            <Card>
                <div>
                <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                        {t('Department.input88')} (Coming soon)
                    </p>
                </div>
            </Card>
        </>

    )
});

export default Phieuin;