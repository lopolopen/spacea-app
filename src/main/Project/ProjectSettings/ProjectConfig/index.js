import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Form, Icon, Tabs } from 'antd';
import FolderSetting from './FolderSetting';
import IterationSetting from './IterationSetting';
import './style.less';

const { TabPane } = Tabs;
const WrappedSaveDefFolderForm = Form.create({ name: 'save_def_folder_form' })(FolderSetting);
const WrappedSaveDefIterationForm = Form.create({ name: 'save_def_iter_form' })(IterationSetting);


@inject('appStore')
@observer
class ProjectConfig extends Component {
  state = {
    defaultTab: undefined
  }

  //TODO: hash changed event
  componentDidMount() {
    this.props.appStore.setSubName('ProjectConfig');
    let { location } = this.props;
    let tab = location.hash.split('#').filter(h => h !== '')[0];
    this.setState({
      defaultTab: tab || 'iteration'
    });
  }

  onTabChange = (tab) => {
    let { history } = this.props;
    history.push(`#${tab}`)
  }

  render() {
    let { defaultTab } = this.state;
    if (!defaultTab) return null;
    return (
      <div className='TeamConfig'>
        <Tabs defaultActiveKey={defaultTab} onChange={this.onTabChange}>
          <TabPane
            tab={
              <span>
                <Icon type='retweet' />
                迭代
              </span>
            }
            key='iteration'
          >
            <WrappedSaveDefIterationForm />
          </TabPane>
          <TabPane
            tab={
              <span>
                <Icon type='folder' />
                文件夹
              </span>
            }
            key='folder'
          >
            <WrappedSaveDefFolderForm />
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

export default ProjectConfig;
