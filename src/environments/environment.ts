import {envbase} from './env.const';

export const environment = {
  ...envbase,
  production: false,
  zaloBaseHref: '',     // dev: load từ root
  apiUrl: 'http://127.0.0.1:8000/',
  apiConfig: {
    appId: '3115106723961764982'
  },
  OAId: '3092562594083719724',
  wardId: 1
};
