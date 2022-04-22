import axios from 'axios';
import { message } from 'antd';
import TokenClient from './api/TokenClient';
import _ from 'lodash';

const REACT_APP_ENV = process.env.REACT_APP_ENV;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

let isRefreshing = false;
let queue401 = [];

const isHandlerDisabled = (config = {}) => {
  //workaround
  return config.headers['DisableErrorHandler'];
}

const error = _.debounce((status, generalMsg, serverMsg) => {
  message.error(`${status}: ${serverMsg || generalMsg}`);
}, 200);

const spaceaClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'text/html'
  }
});


[
  spaceaClient
].forEach(client => {
  client.resetApiToken = () => {
    let token = TokenClient.getToken();
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    else {
      client.defaults.headers.common['Authorization'] = undefined;
    }
  };
});

const initInterceptors = (appStore, history) => {
  [
    spaceaClient
  ].forEach(client => {
    client.interceptors.response.use(
      res => {
        return res.data;
      }, async err => {
        let { response, message: msg } = err;
        if (REACT_APP_ENV === 'Development') {
          if (response && response.status === 500) {
            appStore.setError(err);
            throw err;
          }
        }
        if (isHandlerDisabled(err.config)) {
          throw err;
        }
        if (!response) {
          message.error(`网络请求异常：${msg}`);
        } else {
          let { status, data, headers, config } = response;
          let serverMsg = data && data.message;
          switch (status) {
            case 400:
              if (config.url.includes('refresh_token')) {
                appStore.signOut();
                history.push('/sign_in');
              }
              else {
                error(status, '请求参数错误', serverMsg);
              }
              break;
            case 401:
              if (headers.hasOwnProperty('token-expired')) {
                //必须置顶，确保401请求入队
                let promise = new Promise(function (resolve, reject) {
                  queue401.push({ config, resolve, reject });
                });
                if (!isRefreshing) {
                  isRefreshing = true;
                  try {
                    await TokenClient.refreshToken();
                    client.resetApiToken && client.resetApiToken();
                  }
                  finally {
                    isRefreshing = false;
                  }
                  while (queue401.length > 0) {
                    let { config, resolve, reject } = queue401.shift();
                    let token = TokenClient.getToken();
                    config.headers['Authorization'] = `Bearer ${token}`;
                    client.request(config)
                      .then(resolve)
                      .catch(reject);
                  }
                }
                return promise;
              } else if (config.url.includes('auth_token')) {
                appStore.signOut();
                history.push('/sign_in');
              } else {
                error(status, '身份认证失败', serverMsg);
              }
              break;
            case 403:
              error(status, '禁止访问', serverMsg);
              break;
            case 404:
              error(status, '访问的资源不存在', serverMsg);
              break;
            case 405:
              error(status, `方法${config.method.toUpperCase()}不允许`, serverMsg);
              break;
            case 409:
              if (config.method === 'post') error(status, '创建资源冲突', serverMsg);
              if (config.method === 'put' || config.method === 'patch') error(status, '更新资源冲突', serverMsg);
              break;
            case 501:
              error(status, '服务未实现', serverMsg);
              break;
            default:
              break;
          }
        }
        throw err;
      });
  })

};

spaceaClient.resetApiToken();

const { get, post, put, patch, delete: del } = spaceaClient;
export {
  initInterceptors,
  spaceaClient,
  get, post, put, patch, del
};
