import { observable, computed } from 'mobx';
import TeamClient from '../services/api/TeamClient';
import { Iteration } from './TreeNode';

class Team {
  id;
  @observable name;
  @observable desc;
  @observable acronym;
  @observable iterationIds = [];
  project;

  constructor(options) {
    for (let key in options) {
      if (options[key] !== undefined) {
        this[key] = options[key];
      }
    }
    if (!this.project) throw new Error('each team must hold its project.');
  }

  @computed get client() {
    return this.id && new TeamClient(this.id);
  }

  @computed get iterations() {
    return this.iterationIds.map(id => this.project.iterationMap.get(id));
  }

  @computed get cookedIterations() {
    return Iteration.cook(this.iterations);
  }

  @computed get currentIteration() {
    return this.cookedIterations && this.cookedIterations.find(i => i.tag === 'current');
  }

}

export { Team };
