import { observable, computed } from 'mobx';
import MemberClient from '../services/api/MemberClient';

class Member {
  id;
  accountName;
  @observable firstName;
  @observable lastName;
  @observable xing;
  @observable ming;
  @observable avatarUrl = null;
  @observable avatarUid = null;

  appStore;

  constructor(options) {
    for (let key in options) {
      if (options[key] !== undefined) {
        this[key] = options[key];
      }
    }
  }

  @computed get avatar() {
    return {
      url: this.avatarUrl,
      uid: this.avatarUid
    };
  }


  @computed get client() {
    return this.id && new MemberClient(this.id);
  }
}

export { Member };
