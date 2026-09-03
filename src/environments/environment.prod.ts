// ⚠ FILE TỰ SINH — ĐỪNG SỬA TAY.
// Sinh bởi: npm run pull-config -- --env=prod
// Doanh nghiệp: Chính quyền số xã Long Hưng (xa-long-hung)
// Thời điểm: 2026-09-02T23:36:08.883Z
//
// Sửa giá trị ở Admin (Super Admin > Doanh nghiệp) rồi chạy lại lệnh trên.
import {envbase} from './env.const';

export const environment = {
  ...envbase,
  production: true,
  zaloBaseHref: '/zapps/2319246518410154776/',
  apiUrl: 'https://api.zalo.hungyen.vn',
  apiPrefix: '/api/v1',
  apiConfig: {
    appId: '2319246518410154776'
  },
  features: {
    authEnabled: true,
    feedbackSubmit: true
  },
  OAId: '2471135367682107807'
};
