import { observable, action, computed, runInAction } from 'mobx';
import update from 'immutability-helper';
import GitLabClient from '../services/api/GitLabClient';
import MemberClient from '../services/api/MemberClient';

class RepoSettingStore {
  appStore;
  @observable accessTokens;
  @observable linkedRepos;
  @observable ownedRepos;
  @observable joinedRepos;

  constructor(appStore) {
    this.appStore = appStore;
  }

  @computed get gitLabRepos() {
    let repos = (this.ownedRepos || []).concat(this.joinedRepos || []);
    return [...new Map(repos.map(r => [r.id, r])).values()];
  }

  @computed get validAccessTokens() {
    let { me } = this.appStore;
    return this.accessTokens.filter(t => t.isShared || t.ownerId === me.id);
  }

  @action
  async loadAccessTokens() {
    let { project } = this.appStore;
    let tokens = await project.client.getAccessTokens();
    runInAction(() => {
      this.accessTokens = tokens;
    });
  }

  @action
  async loadLinkedRepos() {
    let { project } = this.appStore;
    let repos = await project.client.getRepos();
    runInAction(() => {
      this.linkedRepos = repos;
      this.linkedRepos.forEach(r => {
        if (r.jokerpipeStatus === 'updating') {
          this.syncJokerpipeStatus(r.id);
        }
      });
    });
  }

  @action
  async dislinkRepo(repoId) {
    let { project } = this.appStore;
    await project.client.deleteRepo(repoId)
    let index = this.linkedRepos.findIndex(r => r.id === repoId);
    if (index >= 0) {
      runInAction(() => {
        this.linkedRepos = update(this.linkedRepos, { $splice: [[index, 1]] });
      });
    }
  }

  @action
  async loadOwnedGitLabRepos(ownerId) {
    if (!this.accessTokens) return;
    let { me } = this.appStore;
    ownerId = ownerId || me.id;
    let token = this.accessTokens.find(t => t.ownerId === ownerId);
    if (!token) return;
    let repos = await GitLabClient.Repos.getOwnedRepos(token.cipherValue);
    runInAction(() => {
      this.ownedRepos = repos;
    });
  }

  @action
  async loadJoinedGitLabRepos(ownerId) {
    if (!this.accessTokens) return;
    let { me } = this.appStore;
    ownerId = ownerId || me.id;
    let token = this.accessTokens.find(t => t.ownerId === ownerId);
    if (!token) return;
    let repos = await GitLabClient.Repos.getJoinedRepos(token.cipherValue);
    runInAction(() => {
      this.joinedRepos = repos;
    });
  }

  @action
  async linkGitLabRepos(repos) {
    let { project } = this.appStore;
    let newRepos = await project.client.linkRepos(repos);
    runInAction(() => {
      this.linkedRepos = update(this.linkedRepos, {
        $push: newRepos
      });
      this.linkedRepos.forEach(r => {
        if (r.jokerpipeStatus === 'updating') {
          this.syncJokerpipeStatus(r.id);
        }
      });
    })
  }

  @action
  async shareAccessTokenOrNot(ownerId, isShared) {
    let memberClient = new MemberClient(ownerId);
    await memberClient.shareAccessTokenOrNot(isShared);
    let index = this.accessTokens.findIndex(t => t.ownerId === ownerId);
    if (index >= 0) {
      runInAction(() => {
        this.accessTokens = update(this.accessTokens, {
          [index]: {
            isShared: { $set: isShared }
          }
        });
      });
    }
  }
}

export default RepoSettingStore;
