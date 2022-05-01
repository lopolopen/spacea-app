import { observable, action, computed, runInAction } from 'mobx';
import update from 'immutability-helper';
import ServiceClient from '../services/api/ServiceClient';
import MemberClient from '../services/api/MemberClient';
import { Member } from '../stores/MemberStore';
import { loading } from '../utility';
import MinioUserClient from '../services/api/MinioUserClient';

class Service {
  id;
  @observable name;
  @observable description;
  @observable creator;
  @observable minioUsers = [];
  @observable apiKeys = [];
  creatorId;
  createdDate;
  publicBaseUrl;
  consoleUrl;
  apiBaseUrl;

  appStore;

  constructor(options) {
    for (let key in options) {
      if (options[key] !== undefined) {
        this[key] = options[key];
      }
    }
  }

  @computed get client() {
    return this.id && new ServiceClient(this.id);
  }

  @action
  async load() {
    let creator;
    if (this.creatorId) {
      creator = await MemberClient.single(this.creatorId);
    } else {
      creator = { id: 1, firstName: '?', lastName: '?', accountName: '?' };
    }
    let apiKeys = await this.client.getApiKeys();
    runInAction(() => {
      this.creator = new Member(creator);
      this.apiKeys = apiKeys;
    });
  }

  @action
  async createApiKey(accessKey, apiKey) {
    let minioUserClient = new MinioUserClient(accessKey);
    let newApiKey = await minioUserClient.createApiKey(apiKey);
    runInAction(() => {
      this.apiKeys = update(this.apiKeys, { $push: [newApiKey] });
    });
  }
}

class ServiceStore {
  appStore;
  @observable services = [];

  constructor(appStore) {
    this.appStore = appStore;
  }

  @loading
  @action
  async load() {
    let services = await ServiceClient.all() || [];
    runInAction(() => {
      this.services = services.map(s => {
        return new Service(s);
      });
    });
  }

  @action
  async create(service) {
    let newServiceObj = await ServiceClient.create(service);
    if (!newServiceObj) return;
    let newService = new Service(newServiceObj);
    runInAction(() => {
      this.services = update(this.services, { $push: [newService] });
    });
    return newService;
  }

  // @action
  // async loadDetails() {
  //   if (!this.id || this.detailed) return;
  //   this.loading = true;
  //   let detail = await this.client.getDetails();
  //   runInAction(()=>{

  //   });
  // }

  @action
  async deleteService(serviceId) {
    await ServiceClient.remove(serviceId);
    let index = this.services.findIndex(s => s.id === serviceId);
    if (index >= 0) {
      runInAction(() => {
        this.services = update(this.services, { $splice: [[index, 1]] });
      });
    }
  }
}

export default ServiceStore;
export { Service };
