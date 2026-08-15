import {envbase} from './env.const';

export const environment = {
  ...envbase,
  production: false,
  zaloBaseHref: '',     // dev: load từ root
  apiUrl: 'http://127.0.0.1:8000/',
  apiConfig: {
    appId: '3702118187570639533'
  },
  OAId: '1256206394473517476',
  wardId: 4
};
