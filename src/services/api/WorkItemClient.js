import { get, post, put, patch, del } from '../axiosConfig';
import queryString from 'query-string';

class WorkItemClient {
  id;
  constructor(id) {
    this.id = id;
  }

  transferFolder(transfer) {
    return post(`workitems/${this.id}/transfer`, transfer);
  }

  setAsChild(parentId) {
    return put(`workitems/${this.id}/parents/${parentId || ''}`);
  }

  createTags(tags) {
    return post(`workitems/${this.id}/tags`, tags);
  }

  getTags() {
    return get(`workitems/${this.id}/tags`);
  }

  getDetails() {
    return get(`/workitems/${this.id}/details`);
  }

  getSummary() {
    return get(`/workitems/${this.id}/summary`);
  }

  getChildrenSummary() {
    return get(`/workitems/${this.id}/childrensummary`);
  }

  getHistories() {
    return get(`/workitems/${this.id}/histories`);
  }

  static getProdBugs(from, to, showClosedItem) {
    let query = queryString.stringify({
      from,
      to,
      showClosedItem
    });
    return get(`/workitems/prodbugs?${query}`);
  }

  static single(id) {
    return get(`/workitems/${id}`);
  }

  static update(id, workitem) {
    return put(`/workitems/${id}`, workitem);
  }

  static partialUpdate(id, workitem) {
    return patch(`/workitems/${id}`, workitem);
  }

  static remove(id) {
    return del(`/workitems/${id}`);
  }

  static all() {
    return get('/workitems');
  }
}

export default WorkItemClient;

