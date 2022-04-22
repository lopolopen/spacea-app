import { post, get } from '../axiosConfig';

//TODO: to be deleted
localStorage.removeItem('me');

const LOCAL_STORAGE_TOKEN = 'token';
const LOCAL_STORAGE_REFRESH_TOKEN = 'refresh_token';

class TokenClient {
  static authToken() {
    return get('/auth_token');
  }

  static async refreshToken() {
    let tokens = await post('/refresh_token', {
      token: TokenClient.getToken(),
      refreshToken: TokenClient.getRefreshToken()
    });
    if (tokens) {
      TokenClient.setTokens(tokens);
      return tokens.token;
    }
  }

  static async revokeRefreshToken() { }

  static getToken() {
    return localStorage.getItem(LOCAL_STORAGE_TOKEN);
  }

  static getRefreshToken() {
    return localStorage.getItem(LOCAL_STORAGE_REFRESH_TOKEN);
  }

  static setToken(token) {
    localStorage.setItem(LOCAL_STORAGE_TOKEN, token)
  }

  static setRefreshToken(refreshToken) {
    localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN, refreshToken)
  }

  static setTokens(tokens) {
    if (!tokens) return;
    TokenClient.setToken(tokens.token);
    TokenClient.setRefreshToken(tokens.refreshToken);
  }

  static clearTokens() {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_REFRESH_TOKEN);
  }
};

export default TokenClient;
