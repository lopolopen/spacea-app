import { get, post, put, del } from '../axiosConfig';

class TeamClient {
  id;
  constructor(id) {
    this.id = id;
  }

  update(team) {
    return put(`/teams/${this.id}`, team);
  }

  // getWorkItems() {
  //   return get(`/teams/${this.id}/workitems`);
  // }

  getMembers() {
    return get(`/teams/${this.id}/members`);
  }

  selectFolder(folderId) {
    return put(`/teams/${this.id}/selectfolder?folderId=${folderId}`);
  }

  deselectFolder(folderId) {
    return del(`/teams/${this.id}/deselectfolder?folderId=${folderId}`);
  }

  selectIteration(iterationId) {
    return post(`/teams/${this.id}/selectiteration?iterationId=${iterationId}`);
  }

  deselectIteration(iterationId) {
    return del(`/teams/${this.id}/deselectiteration?iterationId=${iterationId}`);
  }

  updateDefaultIteration(iterationId) {
    return put(`/teams/${this.id}/defaultiteration/${iterationId}`);
  }

  updateDefaultFolder(folderId) {
    return put(`/teams/${this.id}/defaultfolder/${folderId}`);
  }

  getCapacities(iterationId) {
    return get(`/teams/${this.id}/iterations/${iterationId}/capacities`);
  }

  updateCapacities(iterationId, capacities) {
    return put(`/teams/${this.id}/iterations/${iterationId}/capacities`, capacities);
  }

  static remove(id) {
    return del(`/teams/${id}`);
  }

}

export default TeamClient;
