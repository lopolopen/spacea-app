import { get, post, put } from '../axiosConfig';
import queryString from 'query-string';

class AttachmentClient {
  id;
  options = {};
  constructor(id, options) {
    this.id = id;
    if (options) this.options = options;
  }

  attachTo(workItemId) {
    return put(`attachments/${this.id}/attachto/${workItemId}`);
  }

  detach() {
    return put(`attachments/${this.id}/detach`);
  }

  static upload(file) {
    let formData = new FormData();
    formData.append('file', file);
    return post('/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  static download(id, fileName) {
    let query = queryString.stringify({
      fileName
    });
    return get(`/attachments/${id}/download?${query}`, {
      responseType: 'blob'
    })
  }
}

export default AttachmentClient;
