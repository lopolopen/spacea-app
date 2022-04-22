import { get, post, put, del } from '../axiosConfig';
import queryString from 'query-string';

class MemberClient {
  id;
  constructor(id) {
    this.id = id;
  }

  getConfig(keys) {
    let keysQuery = queryString.stringify({ keys });
    return get(`/members/${this.id}/configs?${keysQuery}`);
  }

  saveConfig(config) {
    return put(`/members/${this.id}/configs`, config);
  }

  shareAccessTokenOrNot(isShared) {
    return put(`/members/${this.id}/configs/accesstoken?isShared=${isShared}`)
  }

  disable(disabled) {
    let query = queryString.stringify({ disabled });
    return post(`/members/${this.id}/disable?${query}`);
  }

  update(member) {
    return put(`members/${this.id}`, member);
  }

  uploadAvatar(avatarFile, avatarUid) {
    let formData = new FormData();
    formData.append('file', avatarFile, 'avatar');
    let query = queryString.stringify({ uid: avatarUid });
    return post(`/members/${this.id}/avatar?${query}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  removeAvatar() {
    return del(`/members/${this.id}/avatar`);
  }

  static single(id) {
    return get(`/members/${id}`);
  }

  static update(id, member) {
    return put(`/members/${id}`, member);
  }

  static remove(id) {
    return del(`/members/${id}`);
  }

  static all() {
    return get('/members');
  }
}

export default MemberClient;

