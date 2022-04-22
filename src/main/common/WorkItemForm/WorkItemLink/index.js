/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Table, Icon } from 'antd'
import moment from 'moment';
import Truncate from '../../../../components/Truncate';
import WorkItemIcon from '../../../../components/WorkItemIcon';
import StateBadge from '../../../../components/StateBadge';
import PriorityTag from '../../../../components/PriorityTag';
import MemberAvatar from '../../../../components/MemberAvatar';
import WorkItemClient from '../../../../services/api/WorkItemClient';
import './style.less';

class WorkItemLink extends Component {
  state = {
    parent: null
  };

  columns = [{
    title: 'ID',
    dataIndex: 'id',
    render: (id, { linkType }) => linkType || id
  }, {
    title: '标题',
    dataIndex: 'title',
    render: (title, record) => (
      !record.linkType &&
      <span>
        <WorkItemIcon className='workitem-icon'
          type={record.type}
          style={{ marginRight: 6 }}
        />
        <a target='_blank'
          style={{ color: 'rgba(0, 0, 0, 0.65)' }}
          href={`/projects/${this.props.projectId}/workitems/${record.id}`}>
          <Truncate text={title} maxWidth={400} />
        </a>
      </span>
    )
  }, {
    title: '状态',
    dataIndex: 'state',
    render: (state, { type, linkType }) => !linkType && <StateBadge state={state} type={type} />
  }, {
    title: '优先级',
    dataIndex: 'priority',
    render: (priority, { linkType }) => !linkType && <PriorityTag priority={priority} />
  }, {
    title: '分配给',
    dataIndex: 'assignedTo',
    render: (assignedTo, { linkType }) => !linkType && <MemberAvatar member={assignedTo} size={'small'} labeled />
  }, {
    title: '最后更新',
    dataIndex: 'changedDate',
    render: (date, { linkType }) => {
      if (linkType) return undefined;
      let daysGap = moment().diff(date, 'days');
      if (daysGap > 3) return moment(date).format('YYYY-M-D');
      return moment(date).fromNow();
    }
  }];


  async componentDidMount() {
    // 外层Modal的destroyOnClose必须设为true
    let { workItem } = this.props;
    let { id, parentId, parent } = workItem;
    let noParent = !parent || !parent.id;
    if (parentId && noParent) {
      parent = await new WorkItemClient(parentId).getSummary();
    }
    let children;
    if (id) {
      children = await new WorkItemClient(id).getChildrenSummary();
      children.sort((x, y) => {
        if (x.order > y.order) return 1;
        else return -1;
      });
    }
    this.setState({ parent, children });
  }

  render() {
    let { parent, children } = this.state;
    let dataSource = []
      .concat(!parent || !parent.id ? [] : [{
        id: 'parent',
        linkType: '父级事项',
        children: [{ ...parent, children: undefined }]
      }])
      .concat(!children || children.length === 0 ? [] : [{
        id: 'child',
        linkType: '子级事项',
        children: children.map(wi => ({ ...wi, children: undefined }))
      }]);
    return (
      <div className='WorkItemLink'>
        <Table rowKey='id'
          size='small'
          defaultExpandedRowKeys={['child', 'parent']}
          expandIcon={(props) => {
            if (!props.expandable) return null;
            if (props.expanded) {
              return (
                <a className='toggle-icon'
                  onClick={e => {
                    props.onExpand(props.record, e);
                  }}
                >
                  <Icon type='down' />
                </a>
              );
            } else {
              return (
                <a className='toggle-icon'
                  onClick={e => {
                    props.onExpand(props.record, e);
                  }}
                >
                  <Icon type='right' />
                </a>
              );
            }
          }}
          pagination={false}
          columns={this.columns}
          dataSource={dataSource} />
      </div>
    );
  }

}

export default WorkItemLink;
