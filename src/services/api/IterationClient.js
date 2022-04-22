import { put, del, patch } from '../axiosConfig';

class IterationClient {
  static update(id, iteration) {
    return put(`/iterations/${id}`, iteration);
  }

  static partialUpdate(id, iteration) {
    return patch(`/iterations/${id}`, iteration);
  }

  static remove(id, toId) {
    return del(`/iterations/${id}?toId=${toId || ''}`);
  }
}

export default IterationClient;
