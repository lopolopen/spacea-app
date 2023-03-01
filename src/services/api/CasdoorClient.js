import { nakedClient } from '../axiosConfig';
import queryString from 'query-string';

class CasdoorClient {
  static async getApplication(id) {
    let query = queryString.stringify({ id });
    let r = await nakedClient.get(`casdoor/api/get-application?${query}`);
    return r.data;
  }
}

export default CasdoorClient;
