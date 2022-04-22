import { get, post } from '../axiosConfig';

class RepoClient {
  id;
  constructor(id) {
    this.id = id;
  }

  createBranch(ref, branch) {
    ref = encodeURIComponent(ref);
    branch = encodeURIComponent(branch)
    return post(`/gitlab/repos/${this.id}/branches?ref=${ref}&branch=${branch}`);
  }

  getBranches() {
    return get(`/gitlab/repos/${this.id}/branches`);
  }

  static getOwnedRepos(tokenCipher) {
    return get(`/gitlab/repos?tokenCipher=${tokenCipher || ''}&owned=true`);
  }

  static getJoinedRepos(tokenCipher) {
    return get(`/gitlab/repos?tokenCipher=${tokenCipher || ''}&owned=false`);

  }

  static single(id) {
    return get(`gitlab/repos/${id}`);
  }
}

class GitLabClient {
  static Repos = RepoClient;
}

export default GitLabClient;
export { RepoClient };
