import { get } from '../axiosConfig';

class TodoClient {
  static getInProgressWorkItemsToMe() {
    return get(`/todos/workitems/inprogress/tome`);
  }

  static getInProgressWorkItemsByMe() {
    return get(`/todos/workitems/inprogress/byme`);
  }
}

export default TodoClient;
