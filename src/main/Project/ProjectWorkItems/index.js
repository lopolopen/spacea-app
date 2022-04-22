import React, { Component } from 'react';
import { Form } from 'antd';
import { inject, observer } from 'mobx-react';
import { autorun } from 'mobx';
import WorkItemIcon from '../../../components/WorkItemIcon';
import WorkItemForm from '../../common/WorkItemForm';
import './style.less';

const WappedWorkItemForm = Form.create({ name: 'workItem_form' })(WorkItemForm);

@inject('appStore')
@observer
class ProjectWorkItems extends Component {
  async componentDidMount() {
    const { appStore } = this.props;
    appStore.setPageName('ProjectWorkItems');
    //监听project（刷新页面，在父组件中异步加载）和workItemId变化
    this.distructor = autorun(async () => {
      const { workItemStore, project } = appStore;
      let { workItemId } = this.props;
      if (project && workItemId) {
        await workItemStore.loadWorkItem(project.id, workItemId);
      }
    });
    await appStore.loadMembers();
  }

  componentWillUnmount() {
    const { appStore: { workItemStore } } = this.props;
    workItemStore.clearWorkItem();
    this.distructor && this.distructor();
  }

  render() {
    const { appStore } = this.props;
    const { workItemStore } = appStore;
    let { workItem } = workItemStore;
    if (!workItem) return null;
    return (
      <div className='ProjectWorkItems'>
        <div className='work-item-detail'>
          <div className='work-item-detail-top-bar'>
            <div>
              <WorkItemIcon type={workItem.type} labeled />
              <span style={{ marginLeft: 8 }}>{workItem.id ? `#${workItem.id}` : '<新建>'}</span>
            </div>
          </div>
          <WappedWorkItemForm
            //部分子组件依赖componentDidMount初始化
            key={workItem.id}
            wrappedComponentRef={(ref) => this.newWorkItemFormRef = ref}
          />
        </div>
      </div>
    );
  }
}

export default ProjectWorkItems;
