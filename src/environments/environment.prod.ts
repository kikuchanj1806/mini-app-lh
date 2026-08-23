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
  OAId: '2471135367682107807',
  wardId: 4
};
