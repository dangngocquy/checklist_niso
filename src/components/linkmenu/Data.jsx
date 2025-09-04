//Cài đặt
export const Settings = (t, phanquyen) => [
  { label: `${t('navigation.classificationSettings')}`, url: `/auth/docs/classification` },
  ...(phanquyen === true ? [
    { label: `${t('Department.input12')}`, url: `/auth/docs/work-progress` }
  ] : []),
  ...(phanquyen === true ? [
    { label: `${t('Department.input75')}`, url: `/auth/docs/set-up-print-tickets` },
  ] : []),
  ...(phanquyen === true ? [
    { label: `${t('Department.input76')}`, url: `/auth/docs/brand-settings` },
  ] : []),
  { label: `${t('navigation.languageSettings')}`, url: `/auth/docs/change-language` }
];

//Thông tin cá nhân
export const Profiles = (t, keys) => [
  { label: `${t('ViewDocs.input16')}`, url: `/auth/docs/profile/${keys}/personal-info` },
  // { label: `${t('Department.input96')}`, url: `/auth/docs/security` },
  { label: `${t('ViewDocs.input18')}`, url: `/auth/docs/history-login` },
];

//Phân quyền
export const Phanquyens = (t) => [
  { label: `${t('Report.input22')}`, url: `/auth/docs/permission-settings` },
  { label: `${t('Report.input23')}`, url: `/auth/docs/account-add` },
];

//báo cáo và phản hồi
export const Reports = (t, phanquyen) => [
  { label: `${t('ListDocs.input8')}`, url: `/auth/docs/feedback-statistics` },
  { label: `${t('ListDocs.input9')}`, url: `/auth/docs/report-list` },
  // ...(phanquyen === true ? [
  //   { label: `${t('Notifications.input28')}`, url: `/auth/docs/user-feedback-statistics` }
  // ] : []),
  { label: `${t('Department.input64')}`, url: `/auth/docs/saved-list` },
];

//Quản lý danh sách
export const Danhsach = (t, phanquyen, tableAData, bophan) => {
  const result = [
    { label: `${t('ListDocs.input35')}`, url: `/auth/docs/survey-management` },
    ...(phanquyen === true || (bophan && typeof bophan === 'string' && tableAData.some(item => item.bophan.toLowerCase() === bophan.toLowerCase() && item.chinhanh === true)) ? 
      [{ label: `${t('ListDocs.input36')}`, url: `/auth/docs/branch-list` }] : []),
  ];

  if (phanquyen === true) {
    result.push({ label: `${t('ListDocs.input37')}`, url: `/auth/docs/internal-management` });
  }

  return result;
};

//Danh sách báo cáo trong báo cáo và phản hồi
export const List = (t) => [
  { label: `${t('ListDocs.input9')}`, url: `/auth/docs/report-list` },
];
