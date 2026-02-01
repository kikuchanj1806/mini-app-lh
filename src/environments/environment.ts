import {envbase} from './env.const';

export const environment = {
  ...envbase,
  production: false,
  zaloBaseHref: '',     // dev: load từ root
  apiUrl: 'https://tunglxweb.bot3s.com',
  apiConfig: {
    appId: '3115106723961764982'
  },
  OAId: '3092562594083719724',
  wardId: 1
};
