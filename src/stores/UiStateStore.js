import { observable, action } from 'mobx';

const LOCAL_STORAGE_UI_STATE = 'ui_state';

class UiStateStore {
  appStore;
  @observable projects_menu_key = 'joined';
  @observable content_svc_menu_key = 'mine';
  @observable insert_location_backlog = 'top';
  @observable insert_location_iteration = 'top';
  @observable show_closed_child_backlog = true;
  @observable show_closed_child_iteration = true;
  @observable show_closed_item_iteration = false;
  @observable show_in_progress_item_backlog = false;
  @observable show_closed_item_prodbug = true;
  @observable show_closed_item_codereview = true;
  @observable sider_collapsed = false;
  @observable sider_menu_keys = [];
  @observable sider_project_menu_keys = [];
  @observable planning_panel_visiable = false;
  @observable analysis_panel_visiable = false;
  @observable statistics_panel_visiable = true;
  @observable work_item_table_size = 8;

  @observable latest_accessed_projects = [];

  @observable preffered_language = 'zhCN';

  constructor(appStore) {
    this.appStore = appStore;
  }

  @action
  loadUiState() {
    let uiStateJson = localStorage.getItem(LOCAL_STORAGE_UI_STATE);
    if (uiStateJson) {
      let uiState = JSON.parse(uiStateJson);
      for (let key in uiState) {
        this[key] = uiState[key];
      }
    }
  }

  @action
  setUiState(key, value) {
    this[key] = value;
    let uiStateJson = localStorage.getItem(LOCAL_STORAGE_UI_STATE);
    let uiState = uiStateJson ? JSON.parse(uiStateJson) : {};
    uiState = { ...uiState, [key]: value };
    uiStateJson = JSON.stringify(uiState);
    localStorage.setItem(LOCAL_STORAGE_UI_STATE, uiStateJson);
  }

  @action
  loadMyUiState() {
    let { me } = this.appStore;
    if (!me) throw new Error();
    let myUiStateJson = localStorage.getItem(`${LOCAL_STORAGE_UI_STATE}_${me.accountName}`);
    if (myUiStateJson) {
      let myUiState = JSON.parse(myUiStateJson);
      for (let key in myUiState) {
        this[key] = myUiState[key];
      }
    }
  }

  @action
  setMyUiState(key, value) {
    let { me } = this.appStore;
    if (!me) throw new Error();
    this[key] = value;
    let myUiStateJson = localStorage.getItem(`${LOCAL_STORAGE_UI_STATE}_${me.accountName}`);
    let myUiState = myUiStateJson ? JSON.parse(myUiStateJson) : {};
    myUiState = { ...myUiState, [key]: value };
    myUiStateJson = JSON.stringify(myUiState);
    localStorage.setItem(`${LOCAL_STORAGE_UI_STATE}_${me.accountName}`, myUiStateJson);
  }
}

export default UiStateStore;
