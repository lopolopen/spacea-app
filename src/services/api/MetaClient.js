import { get } from '../axiosConfig';

class MetaClient {

  static getMetas() {
    return get('/metas');
  }
}

export default MetaClient;
