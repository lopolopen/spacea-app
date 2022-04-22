import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Form, Icon, Tabs } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from "@fortawesome/free-regular-svg-icons";
import FolderSetting from './FolderSetting';
import IterationSetting from './IterationSetting';
import CapacitySetting from './CapacitySetting';
import './style.less';

const { TabPane } = Tabs;
const WrappedSaveDefFolderForm = Form.create({ name: 'save_def_folder_form' })(FolderSetting);
const WrappedSaveDefIterationForm = Form.create({ name: 'save_def_iter_form' })(IterationSetting);


@inject('appStore')
@observer
class TeamConfig extends Component {
  state = {
    defaultTab: undefined
  }

  //TODO: hash changed event
  componentDidMount() {
    this.props.appStore.setSubName('TeamConfig');
    let { teamId, location, appStore } = this.props;
    let { teamConfigStore } = appStore;
    teamConfigStore.selectTeam(parseInt(teamId));
    let tab = location.hash.split('#').filter(h => h !== '')[0];
    this.setState({
      defaultTab: tab || 'iteration'
    });
  }

  componentDidUpdate() {
    let { teamConfigStore } = this.props.appStore;
    let { teamId } = this.props;
    teamConfigStore.selectTeam(parseInt(teamId));
  }

  componentWillUnmount() {
    let { teamConfigStore } = this.props.appStore;
    teamConfigStore.clearDefIterationOfCurrentTeam();
  }

  onTabChange = (tab) => {
    let { history } = this.props;
    history.push(`#${tab}`)
  }

  render() {
    let { defaultTab } = this.state;
    if (!defaultTab) return null;
    let {
      teamConfigStore: {
        currentTeam
      }
    } = this.props.appStore;
    if (!currentTeam) return null;
    return (
      <div className='TeamConfig'>
        <Tabs defaultActiveKey={defaultTab} onChange={this.onTabChange}>
          <TabPane
            tab={<span>常规</span>}
            key='general'
            disabled
          >
          </TabPane>
          <TabPane
            tab={
              <span>
                <Icon type='flag' />
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
          <TabPane
            tab={
              <span>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 8 }} />
                生产工时
              </span>
            }
            key='capacity'
          >
            <CapacitySetting />
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

export default TeamConfig;
