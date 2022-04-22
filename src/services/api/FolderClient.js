import { put, del, patch } from '../axiosConfig';

class FolderClient {
  static update(id, folder) {
    return put(`/folders/${id}`, folder);
  }

  static partialUpdate(id, folder) {
    return patch(`/folders/${id}`, folder);
  }

  static remove(id, toId) {
    return del(`/folders/${id}?toId=${toId || ''}`);
  }
}

export default FolderClient;
