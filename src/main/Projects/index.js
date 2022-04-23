import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { message, Button, Form, Menu, Icon, Radio, Input } from 'antd';
import _ from 'lodash';
import CardView from './CardView';
import NewProjectForm from './NewProjectForm';
import UiStateKeys from '../../stores/UiStateKeys';
import { injectIntl, FormattedMessage } from 'react-intl';
import './style.less';

const WappedCreateForm = Form.create({ name: 'create_form' })(NewProjectForm);

@injectIntl
@inject('appStore')
@observer
class Projects extends Component {
  formRef;
  state = {
    loading: true,
    visible: false,
    confirmLoading: false,
    keys: []
  };

  async componentDidMount() {
    const { appStore } = this.props;
    appStore.setPageName('Projects');
    const { projectStore, uiStateStore } = appStore;
    await projectStore.load();
    this.setState({
      loading: false
    }, () => {
      if (uiStateStore.projects_menu_key === 'search') {
        setTimeout(() => {
          if (this.searchBoxRef) {
            this.searchBoxRef.focus();
          }
        }, 50)
      }
    });
  }

  showModal = () => {
    this.setState({ visible: true });
  };

  handleCreateCancel = () => {
    this.setState({
      visible: false,
      confirmLoading: false
    });
  };

  handleCreateOk = () => {
    const { appStore: { projectStore } } = this.props;
    let { form } = this.formRef.props;
    form.validateFields(async (err, values) => {
      try {
        if (err) return;
        this.setState({
          confirmLoading: true
        });
        await projectStore.create(values);
        this.handleCreateCancel();
        form.resetFields();
        message.success(`项目 ${values.name} 创建成功`);
      } catch (error) {
        this.setState({
          confirmLoading: false
        });
        throw error;
      }
    });
  }

  isJoined = (project, me) => {
    let { members } = project;
    return members.some(m => m.id === me.id);
  }

  search = _.debounce((text) => {
    let keys = text.split(' ')
      .map(key => key.trim())
      .filter(key => key);
    this.setState({ keys });
  }, 200);

  handleClick = e => {
    this.setState({
      currentKey: e.key,
    });
  };

  setProjectsMenuKey = key => {
    let { appStore: { uiStateStore } } = this.props;
    uiStateStore.setUiState(UiStateKeys.PROJECTS_MENU_KEY, key);
  }

  render() {
    let { loading, visible, confirmLoading, keys } = this.state;
    let { appStore, intl } = this.props;
    let {
      projectStore,
      me,
      uiStateStore
    } = appStore;
    let menuKey = uiStateStore.projects_menu_key;
    let { projects } = projectStore;
    let usedNames = projects.map(p => p.name);
    if (menuKey === 'joined') {
      projects = projects.filter(p => this.isJoined(p, me))
    } else if (menuKey === 'latest') {
      let projMap = new Map(projects.map(p => [p.id, p]));
      let latestIds = (uiStateStore.latest_accessed_projects).map(p => p.id);
      projects = latestIds.map(id => projMap.get(id)).filter(p => p);
      if (latestIds.length > projects.length) {
        let projs = projects.map(p => ({ id: p.id, name: p.name }));
        uiStateStore.setMyUiState(UiStateKeys.LATEST_ACCESSED_PROJECTS, projs);
      }
    }
    // projects = projects.sort((x, y) => y.id - x.id);

    return (
      <div className='Projects'>
        <div className='top-bar-wrapper'>
          <div className='top-bar'>
            <div className='up'>
              <Menu onClick={this.handleClick} selectedKeys={[menuKey]} mode='horizontal'>
                <Menu.Item key='joined' onClick={() => this.setProjectsMenuKey('joined')}>
                  <FormattedMessage id='menu_joined' />
                </Menu.Item>
                <Menu.Item key='latest' onClick={() => this.setProjectsMenuKey('latest')}>
                  <FormattedMessage id='menu_latest_visited' />
                </Menu.Item>
                <Menu.Item key='all' onClick={() => this.setProjectsMenuKey('all')}>
                  <FormattedMessage id='menu_all_projects' />
                </Menu.Item>
                <Menu.Item disabled key='watched'>
                  <Icon type="star" theme="filled" />
                  <FormattedMessage id='menu_starred' />
                </Menu.Item>
                <Menu.Item disabled key='recycle' onClick={() => this.setProjectsMenuKey('recycle')}>
                  <Icon type="rest" theme="filled" />
                  <FormattedMessage id='menu_recycle_bin' />
                </Menu.Item>
                <Menu.Item key='search' onClick={() => this.setProjectsMenuKey('search')}>
                  <Input
                    className='search-box'
                    placeholder={intl.formatMessage({ id: 'menu_search' })}
                    prefix={<Icon type='search' />}
                    onChange={e => this.search(e.target.value)}
                    ref={ref => this.searchBoxRef = ref}
                  // allowClear
                  />
                </Menu.Item>
              </Menu>
            </div>
            <div className='down' style={{ padding: 8 }}>
              <Button type='primary' onClick={this.showModal}><Icon type='plus' />
                <FormattedMessage id='btn_new_project' />
              </Button>
              <Radio.Group value={'card'}>
                <Radio.Button value='card'>
                  <FormattedMessage id='view_card' />
                </Radio.Button>
                <Radio.Button disabled value='list'>
                  <FormattedMessage id='view_list' />
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </div>
        <div className='projet-cards'>
          <div style={{ overflow: 'hidden' }}>
            <CardView
              projects={projects}
              loading={loading}
              keys={menuKey === 'search' ? keys : undefined}
            />
          </div>
        </div>
        <WappedCreateForm
          wrappedComponentRef={(ref) => this.formRef = ref}
          visible={visible}
          confirmLoading={confirmLoading}
          onCancel={this.handleCreateCancel}
          onOk={this.handleCreateOk}
          usedNames={usedNames} />
      </div >
    )
  }
};

export default Projects;
