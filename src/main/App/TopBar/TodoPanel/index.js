/* eslint-disable react/jsx-no-target-blank */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { List, Tabs, Empty, Tag, Spin, Icon } from 'antd';
import classNames from 'classnames';
import Truncate from '../../../../components/Truncate';
import utility from '../../../../utility';
import StateBadge from '../../../../components/StateBadge';
import WorkItemIcon from '../../../../components/WorkItemIcon';
import { Link } from 'react-router-dom';

import { injectIntl, FormattedMessage } from 'react-intl';

@injectIntl
@inject('appStore')
@observer
class TodoPanel extends Component {
  state = {
    loading: true,
    key: 'tome'
  }

  async componentDidMount() {
    await this.loadTodo(this.state.key);
  }

  async loadTodo(key) {
    const { appStore: { todoStore } } = this.props;
    this.setState({
      key,
      loading: true
    });
    await Promise.all([
      todoStore.loadInProgressWorkItems(key),
      //给页签动画足够的时间
      utility.delay(300)
    ]);
    this.setState({
      loading: false
    });
  }

  render() {
    let { loading, key } = this.state;
    const {
      appStore: { todoStore, workItemStore },
      intl
    } = this.props;
    let groupedWorkItems = loading ? [] : todoStore.groupedWorkItems;
    let mergeRequests = [];
    let currentId = workItemStore.workItem && workItemStore.workItem.id;
    return (
      <div>
        <Tabs defaultActiveKey={key} onChange={(key) => this.loadTodo(key)}>
          {/* <Tabs.TabPane tab='待办' key='0' disabled>
            <Empty />
          </Tabs.TabPane> */}
          <Tabs.TabPane tab={
            <span>
              <span><FormattedMessage id='menu_assigned_to_me' /></span>
              {
                key !== 'tome' ? null :
                  <span style={{ color: '#FFA39E', fontWeight: 'bolder', marginLeft: 4 }}>
                    {loading ? <Icon type='sync' spin /> : `(${todoStore.count})`}
                  </span>
              }
            </span>
          } key='tome'>
            {
              loading ?
                <div style={{ textAlign: 'center', margin: '20px 0' }} >
                  <Spin />
                  {loading}
                </div> :
                groupedWorkItems.length === 0 ? <Empty /> :
                  <div className='scroll-list'>
                    {
                      groupedWorkItems.map(p =>
                        <List key={p.id}
                          header={<Link to={`/projects/${p.id}`}>{p.name}</Link>}
                          dataSource={p.workItems}
                          size='small'
                          renderItem={
                            workItem => {
                              const type = workItem.type;
                              const state = workItem.state;
                              return (
                                <List.Item className={classNames({ 'active': currentId === workItem.id })}>
                                  <List.Item.Meta
                                    title={
                                      <span>
                                        <WorkItemIcon type={type} />
                                        <Link style={{ marginLeft: 8 }}
                                          to={`/projects/${p.id}/workitems/${workItem.id}`}>
                                          <Truncate text={workItem.title} maxWidth={300} titled />
                                        </Link>
                                      </span>
                                    }
                                    description={
                                      <span>
                                        {`#${workItem.id}`}
                                        {workItem.tags && workItem.tags.map((tag, idx) =>
                                          <Tag style={{ marginLeft: '16px' }} key={idx} color={tag.color}>{tag.text}</Tag>)}
                                      </span>}
                                  />
                                  <StateBadge type={type} state={state} />
                                </List.Item>
                              )
                            }}
                        />)
                    }
                  </div>
            }
          </Tabs.TabPane>
          <Tabs.TabPane tab={
            <span>
              <span><FormattedMessage id='menu_created_by_me' /></span>
              {
                key !== 'byme' ? null :
                  <span style={{ color: '#A7E8B4', fontWeight: 'bolder', marginLeft: 4 }}>
                    {loading ? <Icon type='sync' spin /> : `(${todoStore.count})`}
                  </span>
              }
            </span>
          } key='byme'>
            {
              loading ?
                <div style={{ textAlign: 'center', margin: '20px 0' }} >
                  <Spin />
                </div> :
                groupedWorkItems.length === 0 ? <Empty /> :
                  <div className='scroll-list'>
                    {
                      groupedWorkItems.map(p =>
                        <List key={p.id}
                          header={<Link to={`/projects/${p.id}`}>{p.name}</Link>}
                          dataSource={p.workItems}
                          size='small'
                          renderItem={
                            workItem => {
                              const type = workItem.type;
                              const state = workItem.state;
                              return (
                                <List.Item className={classNames({ 'active': currentId === workItem.id })}>
                                  <List.Item.Meta
                                    title={
                                      <span>
                                        <WorkItemIcon type={type} />
                                        <Link style={{ marginLeft: 8 }}
                                          to={`/projects/${p.id}/workitems/${workItem.id}`}>
                                          <Truncate text={workItem.title} maxWidth={300} titled />
                                        </Link>
                                      </span>
                                    }
                                    description={
                                      <span>
                                        {`#${workItem.id}`}
                                        {workItem.tags && workItem.tags.map((tag, idx) =>
                                          <Tag style={{ marginLeft: '16px' }} key={idx} color={tag.color}>{tag.text}</Tag>)}
                                      </span>}
                                  />
                                  <StateBadge type={type} state={state} />
                                </List.Item>
                              )
                            }}
                        />)
                    }
                  </div>
            }
          </Tabs.TabPane>
          {/* <Tabs.TabPane tab='合并请求' key='mr' disabled>
            {
              mergeRequests.length > 0 ?
                <div className='scroll-list'>{
                  <List
                    dataSource={mergeRequests}
                    size='small'
                    renderItem={
                      mr => {
                        return (
                          <List.Item>
                            <a target='_blank' href={mr.url}>MR</a>
                          </List.Item>
                        )
                      }}
                  />
                }</div>
                :
                <Empty />
            }
          </Tabs.TabPane> */}
          <Tabs.TabPane tab={intl.formatMessage({ id: 'menu_watched' })} key='fav' disabled>
            <Empty />
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  }
}

export default TodoPanel;
