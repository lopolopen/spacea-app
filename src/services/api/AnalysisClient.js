import { get, post } from '../axiosConfig';

class AnalysisClient {
  static getBurndownTrend(teamId, iterationId) {
    return get(`analyses/burndown/teams/${teamId}/iterations/${iterationId}`);
  }

  static getCurrentPoints(teamId, iterationId) {
    return get(`analyses/burndown/teams/${teamId}/iterations/${iterationId}/current`);
  }

  static runAccountingJob(teamId, iterationId) {
    return post(`analyses/burndown/teams/${teamId}/iterations/${iterationId}/runjob`);
  }

  static getWorkloads(teamId, iterationId, remainingDays) {
    return get(`analyses/workloads/teams/${teamId}/iterations/${iterationId}?remainingDays=${remainingDays}`);
  }
}

export default AnalysisClient;
