import { get, post, put, del, patch } from '../axiosConfig';
import queryString from 'query-string';

class ProjectClient {
  id;
  options = {};
  constructor(id, options) {
    this.id = id;
    if (options) this.options = options;
  }

  update(project) {
    return put(`/projects/${this.id}`, project);
  }

  uploadAvatar(avatarFile, avatarUid) {
    let formData = new FormData();
    formData.append('file', avatarFile, 'avatar');
    let query = queryString.stringify({ uid: avatarUid });
    return post(`/projects/${this.id}/avatar?${query}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  removeAvatar() {
    return del(`/projects/${this.id}/avatar`);
  }

  remove() {
    return del(`/projects/${this.id}`);
  }

  getMembers() {
    return get(`/projects/${this.id}/members`);
  }

  getWorkItem(workItemId) {
    return get(`/projects/${this.id}/workitems/${workItemId}`);
  }

  getWorkItems(teamId, iterationId, showClosedItem, showClosedChild, showInProgressItem) {
    let query = queryString.stringify({
      iterationId,
      showClosedItem,
      showClosedChild,
      showInProgressItem
    });
    return get(`/projects/${this.id}/teams/${teamId}/workitems?${query}`);
  }

  createWorkItem(folderId, workitem, location) {
    let query = queryString.stringify({ location });
    return post(`/projects/${this.id}/folders/${folderId}/workitems?${query}`, workitem);
  }

  linkRepos(repos) {
    return post(`/projects/${this.id}/repos/bulk`, repos);
  }

  getRepos() {
    return get(`/projects/${this.id}/repos`);
  }

  deleteRepo(repoId) {
    return del(`/projects/${this.id}/repos/${repoId}`);
  }

  // getTeams() {
  //   return get(`/projects/${this.id}/teams`);
  // }

  // getDefaultTeam() {
  //   return get(`/projects/${this.id}/teams?default=true`);
  // }

  createTeam(team) {
    return post(`/projects/${this.id}/teams`, team);
  }

  createTeams(teams) {
    return post(`/projects/${this.id}/teams/bulk`, teams);
  }

  reOrder(workItemId, reOrder) {
    return patch(`/projects/${this.id}/workitems/${workItemId}/reorder`, reOrder);
  }

  // reTreeOrder(treeId, reTreeOrder) {
  //   return patch(`/projects/${this.id}/testtrees/${treeId}/reorder`, reTreeOrder);
  // }

  //TODO
  updateDefaultTeamId(defaultTeamId) {
    return put(`/projects/${this.id}/teams/${defaultTeamId}`);
  }

  createFolder(folder) {
    return post(`projects/${this.id}/folders`, folder);
  }

  createFolderForTeam(teamId, folder) {
    return post(`projects/${this.id}/teams/${teamId}/folders`, folder);
  }

  createIteration(iteration) {
    return post(`projects/${this.id}/iterations`, iteration);
  }

  createIterationForTeam(teamId, iteration) {
    return post(`projects/${this.id}/teams/${teamId}/iterations`, iteration);
  }

  getAccessTokens() {
    return get(`projects/${this.id}/accesstokens`);
  }

  static single(id) {
    return get(`/projects/${id}`);
  }

  static update(id, project) {
    return put(`/projects/${id}`, project);
  }

  static remove(id) {
    return del(`/projects/${id}`);
  }

  static create(project, options) {
    return post('/projects', project, options);
  }

  static all() {
    return get('/projects');
  }

  static getNames(ids) {
    let query = queryString.stringify({ ids });
    return get(`projects/names?${query}`)
  }
}

export default ProjectClient;
