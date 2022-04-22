import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Icon, Tabs } from 'antd';
import AccessTokenManagement from './AccessTokenManagement';
import RepoManagement from './RepoManagement';

import './style.less'

const { TabPane } = Tabs;

@inject('appStore')
@observer
class ReposSetting extends Component {

  async componentDidMount() {
    this.props.appStore.setSubName('ReposSetting');
    let { repoSettingStore } = this.props.appStore;
    await Promise.all([
      repoSettingStore.loadAccessTokens(),
      repoSettingStore.loadLinkedRepos()
    ]);
  }

  render() {
    return (
      <div className='ReposSetting'>
        <Tabs>
          <TabPane
            tab={
              <span>
                <Icon type='safety-certificate' />
                访问令牌
              </span>
            }
            key='token'
          >
            <AccessTokenManagement />
          </TabPane>
          <TabPane
            tab={
              <span>
                <Icon type='gitlab' />
                仓库
              </span>
            }
            key='repo'
          >
            <RepoManagement />
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

export default ReposSetting;
