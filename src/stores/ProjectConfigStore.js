import { action, runInAction } from "mobx";
import FolderClient from '../services/api/FolderClient';
import IterationClient from '../services/api/IterationClient';
import TreeNode, { Iteration, Folder } from './TreeNode';

class ProjectConfigStore {
  appStore

  constructor(appStore) {
    this.appStore = appStore;
  }

  @action
  async createFolder(folderObj) {
    let { project } = this.appStore;
    let newFolderObj = await project.client.createFolder(folderObj);
    var newFolder = new Folder(newFolderObj);
    runInAction(() => {
      let { project, project: { folders } } = this.appStore;
      folders.push(newFolder);
      project.folderTree = TreeNode.treelize(folders);
    });
  }

  @action
  async createIteration(iterationObj) {
    let { project } = this.appStore;
    let newIterationObj = await project.client.createIteration(iterationObj);
    var newIteration = new Iteration(newIterationObj);
    runInAction(() => {
      let { project: { iterations } } = this.appStore;
      iterations.push(newIteration);
    });
  }

  @action
  async updateFolder(folderId, folderObj, current) {
    await FolderClient.update(folderId, folderObj);
    let { project, project: { folders } } = this.appStore;
    let folder = folders.find(f => f.id === folderId);
    runInAction(() => {
      let originalPath = folder.path;
      let newPath = folderObj.path;
      this.updateChildPath(current, originalPath, newPath);
      folder.setName(folderObj.name);
      folder.path = folderObj.path;
      project.folderTree = TreeNode.treelize(folders);
    });
  }

  @action
  async updateIteration(iterationId, iterationObj, mask, current) {
    let keys = Object.keys(iterationObj);
    if (!mask) {
      mask = keys.join(',');
    } else {
      keys = mask.split(',').map(key => key.trim());
    }
    await IterationClient.partialUpdate(iterationId, {
      ...iterationObj,
      mask
    });
    let { project: { iterations } } = this.appStore;
    let iteration = iterations.find(i => i.id === iterationId);

    runInAction(() => {
      if (mask.includes('path')) {
        let originalPath = iteration.path;
        let newPath = iterationObj.path;
        this.updateChildPath(current, originalPath, newPath);
      }
      keys.forEach(key => {
        iteration[key] = iterationObj[key];
        if (key === 'name') {
          iteration.setName(iterationObj.name);
        }
      });
    });
  }

  updateChildPath(current, originalPath, newPath) {
    if (!current || !current.children) return;
    for (let c of current.children) {
      c.path = c.path.replace(new RegExp(`^${originalPath}/`), `${newPath}/`);
      this.updateChildPath(c, originalPath, newPath);
    }
  }

  @action
  async removeFolderWithSubs(folder, toId) {
    await FolderClient.remove(folder.id, toId);
    let { project, project: { folders } } = this.appStore;
    runInAction(() => {
      project.folders = folders.filter(f => !(f.id === folder.id || f.path.startsWith(`${folder.path}/`)));
      project.folderTree = TreeNode.treelize(project.folders);
    });
  }

  @action
  async removeIterationWithSubs(iteration, toId) {
    await IterationClient.remove(iteration.id, toId);
    let { project, project: { iterations } } = this.appStore;
    runInAction(() => {
      project.iterations = iterations.filter(i => !(i.id === iteration.id || i.path.startsWith(`${iteration.path}/`)));
    });
  }
}

export default ProjectConfigStore;
