/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { autorun } from 'mobx';
import { Icon, Tag, Button, Menu, Form, Dropdown, Radio, Badge, Tooltip, Divider, Progress, Popover, Switch, Slider } from 'antd';
import SplitPane from 'react-split-pane';
import Pane from 'react-split-pane/lib/Pane';
import moment from 'moment';
import _ from 'lodash';
import classNames from 'classnames';
// import queryString from 'query-string';
// import { webhookHub } from '../../../services/hub/WebHookHub';
import WorkItemIcon, { typeMap } from '../../../components/WorkItemIcon';

import { WorkItem } from '../../../stores/WorkItemStore';
import AnalysisPanel from './AnalysisPanel';
import UiStateKeys from '../../../stores/UiStateKeys';
import WorkItemTable from '../../common/WorkItemTable';
import './style.less';

@Form.create()
@withRouter
@inject('appStore')
@observer
class ProjectIterations extends Component {
  state = {
    selected: null,
    panelWidth: 350,
    loading: false,
  };

  constructor(props) {
    super(props);
    this.props.appStore.setPageName('ProjectIterations');
  }

  static getDerivedStateFromProps(props, state) {
    let { appStore, teamId, iterationId } = props;
    let { project } = appStore;
    if (project) {
      if (teamId === state.teamId && iterationId === state.iterationId) {
        return null;
      }
      project.selectTeamAndIteration(teamId, iterationId);
      return { teamId, iterationId };
    }
    return null;
  }

  async componentDidMount() {
    let { appStore } = this.props;

    // const values = queryString.parse(search);
    // if (values.id) {
    //   workItemStore.selectKey(parseInt(values.id));
    // }
    // webhookHub.on('on-mr-merged', ({ workItemId }) => {
    //   workItemStore.updateState(workItemId, 'closed');
    //   this.forceUpdate();
    //   message.success('一个合并请求被接受，任务状态更新为：完成。');
    // });
    let {
      workItemStore,
      analysisStore,
      uiStateStore
    } = appStore;
    this._firstrun = true;
    this.distructor = autorun(async () => {
      let { project, pageName } = appStore;
      if (pageName !== 'ProjectIterations') return;
      if (!project) return;
      let { id, selectedTeamId, selectedIterationId } = project;
      await Promise.all([
        workItemStore.load(
          id,
          selectedTeamId,
          selectedIterationId,
          uiStateStore.show_closed_item_iteration,
          uiStateStore.show_closed_child_iteration,
          true
        )
      ]);
      if (!this._firstrun) {
        analysisStore.refreshPanel();
      }
      this._firstrun = false;
    });
    await appStore.loadMembers();
  }

  componentWillUnmount() {
    const { appStore: { workItemStore } } = this.props;
    workItemStore.clearWorkItems();
    workItemStore.useFilter(false);
    this.distructor && this.distructor();
  }

  refresh = async () => {
    this.setState({ loading: true });
    let { appStore } = this.props;
    let {
      project,
      workItemStore,
      analysisStore,
      uiStateStore
    } = appStore;
    let { id, selectedTeamId, selectedIterationId } = project;
    await workItemStore.load(
      id,
      selectedTeamId,
      selectedIterationId,
      uiStateStore.show_closed_item_iteration,
      uiStateStore.show_closed_child_iteration,
      true);
    analysisStore.refreshPanel();
    this.setState({ loading: false });
  }

  cancelFilter = () => {
    this.tableRef && this.tableRef.handleTableChange(undefined, {});
  }

  expandAll = () => {
    this.tableRef && this.tableRef.expandAll();
  }

  shrinkAll = () => {
    this.tableRef && this.tableRef.shrinkAll();
  }

  togglePanel = () => {
    let { appStore: { uiStateStore } } = this.props;
    uiStateStore.setUiState(
      UiStateKeys.ANALYSIS_PANEL_VISIABLE,
      !uiStateStore.analysis_panel_visiable);
  }

  rememberSize = _.debounce((size) => {
    let px = size[1];
    let panelWidth = Number(px.replace('px', ''));
    this.setState({ panelWidth });
  }, 200);

  render() {
    // console.log(this.constructor.name, 'render()');
    const { appStore } = this.props;
    const { workItemStore, project, me, uiStateStore } = appStore;
    if (!project) return null;
    let {
      teams,
      selectedTeam,
      selectedTeamId,
      selectedIteration,
      selectedIterationId
    } = project;
    let { defaultFolder, cookedIterations } = selectedTeam;
    let panelVisible = uiStateStore.analysis_panel_visiable;
    let location = uiStateStore.insert_location_iteration;
    let iterationTagMap = {
      'past': '过去',
      'current': '当前',
      'future': '未来'
    };
    const {
      usingFilter
    } = workItemStore;
    const {
      panelWidth,
      loading,
    } = this.state;
    let base = `/projects/${project.id}`;
    return (
      <div className='ProjectIterations'>
        <div className='top-bar-wrapper'>
          <div className='top-bar'>
            <div className='up' style={{ paddingRight: 8 }}>
              <div className='up-menu'>
                <Menu onClick={null} selectedKeys={['all']} mode='horizontal'>
                  <Menu.Item key='all'>
                    <Icon type='pushpin' theme='filled' />
                    当前积压
                  </Menu.Item>
                  <Menu.Item disabled key='recycle'>
                    <Icon type='rest' theme='filled' />
                    回收站
                  </Menu.Item>
                </Menu>
              </div>
              {
                (() => {
                  if (!selectedIteration) return null;
                  if (selectedIteration.workdays === undefined) return null;
                  let { startDate, endDate, remainingDays, workdays } = selectedIteration;
                  let start = moment(startDate);
                  let end = moment(endDate);
                  let today = moment().startOf('day');
                  let percent;
                  if (workdays === 0) {
                    percent = today < start ? 0 : 100;
                  } else {
                    percent = Math.round(100 * (1 - remainingDays / workdays));
                  };
                  let color = percent < 50 ? '#52c41a' :
                    percent < 90 ? '#faad14' :
                      percent < 100 ? 'rgba(255, 0, 0, .9)' :
                        percent === 100 && end.diff(today, 'days') >= 0 ? 'rgba(255, 0, 0, .9)' :
                          'rgba(0, 0, 0, .6)';
                  return (
                    <div className='up-progress'>
                      <div className='bar'>
                        <Progress
                          percent={percent}
                          size='small'
                          strokeColor={color}
                          format={percent => <span style={{ color }}>{percent + '%'}</span>}
                        />
                      </div>
                      <div className='date-range'>
                        <span>
                          {start.format('M月D日')}
                        </span>
                        <span style={{ margin: '0 4px' }}>-</span>
                        <span>
                          {end.format('M月D日')}
                        </span>
                        <span>
                          {
                            percent === 0 ? '（还没开始）' :
                              percent === 100 && end.diff(today, 'days') >= 0 ? '（即将结束）' :
                                percent === 100 ? '（已经结束）' : (
                                  <span>
                                    <span>（还剩</span>
                                    <span style={{ color, fontWeight: 'bold', margin: '0 8px' }}>{remainingDays}</span>
                                    <span>个工作日）</span>
                                  </span>
                                )
                          }
                        </span>
                      </div>
                    </div>
                  );
                })()
              }
              <div className='up-selector'>
                <Dropdown className='team-selector' overlay={(
                  <Menu>
                    {
                      teams.map(({ id, name, members }) => (
                        <Menu.Item key={id} className={classNames({ 'selected': id === selectedTeamId })}>
                          <Link to={`/projects/${project.id}/teams/${id}/iterations/_current`}>
                            <Badge color={id === selectedTeamId ? '#1890ff' : '#d9d9d9'} text={`${name} 团队`} />
                            {
                              members && members.some(m => m.id === me.id) ?
                                <Tag style={{ float: 'right', marginLeft: 16 }} color={'#1890ff'}>{'我的'}</Tag>
                                :
                                null
                            }
                          </Link>
                        </Menu.Item>
                      ))
                    }
                  </Menu>
                )} trigger={['click']}>
                  <div>
                    <Icon type='team' style={{ marginRight: 4 }} />
                    {`${selectedTeam.name} 团队`}
                    <Icon style={{ paddingLeft: '4px' }} type='down' />
                  </div>
                </Dropdown>
                <Divider type='vertical' style={{ margin: '0 16px' }} />
                <Dropdown className='iteration-selector'
                  disabled={!selectedIteration}
                  overlay={(
                    <Menu>
                      {
                        cookedIterations.map(({ id, name, tag }) => (
                          <Menu.Item key={id} className={classNames({ 'selected': id === selectedIterationId })}>
                            <Link to={`/projects/${project.id}/teams/${selectedTeamId}/iterations/${id}`}>
                              <Badge color={id === selectedIterationId ? '#1890ff' : '#d9d9d9'} text={`迭代 ${name}`} />
                              {
                                id &&
                                <Tag style={{ float: 'right', marginLeft: 16 }} color={tag === 'current' ? '#1890ff' : '#d9d9d9'}>
                                  {iterationTagMap[tag]}
                                </Tag>
                              }
                            </Link>
                          </Menu.Item>
                        ))
                      }
                    </Menu>
                  )} trigger={['click']}>
                  <div>
                    <Icon type='flag' style={{ marginRight: 4 }} />
                    {`迭代 ${selectedIteration ? selectedIteration.name : '无'}`}
                    <Icon style={{ paddingLeft: '4px' }} type='down' />
                  </div>
                </Dropdown>
              </div>
            </div>
            <div className='down' style={{ padding: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Dropdown disabled={usingFilter || !selectedIteration} trigger={['click']} overlay={
                  <Menu>
                    {
                      Object.keys(typeMap).map(type => (
                        <Menu.Item key={type}
                          onClick={() => this.tableRef && this.tableRef.showWorkItemModel(
                            new WorkItem({
                              type,
                              state: 'new',
                              reason: '新建',
                              priority: 'normal',
                              //TODO:
                              folder: defaultFolder,
                              folderId: defaultFolder.id,
                              iterationId: selectedIteration.id,
                            }, appStore))
                          }
                        >
                          <WorkItemIcon type={type} labeled />
                        </Menu.Item>
                      ))
                    }
                  </Menu >
                }>
                  {
                    <Button type='primary'>
                      <Icon type='plus' />
                      新建事项
                      <Icon type='down' />
                    </Button>
                  }
                </Dropdown >
                <Tooltip title='全部展开'>
                  <a disabled={usingFilter} className='toggle icon-btn' style={{ marginLeft: 8 }}>
                    <Icon onClick={this.expandAll} className='icon-btn-icon' type='plus-square' />
                  </a>
                </Tooltip>
                <Tooltip title='全部收缩'>
                  <a disabled={usingFilter} className='toggle icon-btn'>
                    <Icon onClick={this.shrinkAll} className='icon-btn-icon' type='minus-square' />
                  </a>
                </Tooltip>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title='刷新'>
                  <a className='icon-btn' style={{ marginRight: 16 }}>
                    <Icon onClick={this.refresh} className='icon-btn-icon' type='reload' spin={loading} />
                  </a>
                </Tooltip>
                <Popover content={
                  <div className='control-panel'>
                    <div className='label'>新建事项插入位置</div>
                    <Radio.Group
                      onChange={(e) => uiStateStore.setUiState(UiStateKeys.INSERT_LOCATION_ITERATION, e.target.value)}
                      value={location}>
                      <Radio value={'top'}>顶部</Radio>
                      <br />
                      {/* <Radio value={'current'}>当前</Radio>
                      <br /> */}
                      <Radio value={'bottom'}>底部</Radio>
                    </Radio.Group>
                    <Divider />
                    <div className='label'>显示已完结的事项</div>
                    <Switch
                      size='small'
                      checked={uiStateStore.show_closed_item_iteration}
                      onChange={value => {
                        uiStateStore.setUiState(UiStateKeys.SHOW_CLOSED_ITEM_ITERATION, value);
                        this.refresh();
                      }}
                    />
                    <div className='label'>显示已完结的子项</div>
                    <Switch
                      size='small'
                      checked={uiStateStore.show_closed_child_iteration}
                      onChange={value => {
                        uiStateStore.setUiState(UiStateKeys.SHOW_CLOSED_CHILD_ITERATION, value);
                        this.refresh();
                      }}
                    />
                    <Divider />
                    <div className='label'>行间距</div>
                    <Slider dots step={3} min={2} max={14}
                      // tipFormatter={size => ({ 2: 'xs', 5: 's', 8: 'm', 11: 'l', 14: 'xl' }[size])}
                      defaultValue={uiStateStore.work_item_table_size}
                      onChange={size => {
                        uiStateStore.setUiState(UiStateKeys.WORK_ITEM_TABLE_SIZE, size);
                        this.forceUpdate();
                      }}
                    />
                  </div>
                } trigger='click' placement='bottom'>
                  <Tooltip title='控制面板'>
                    <a className='icon-btn' style={{ marginRight: 16 }}>
                      <Icon className='icon-btn-icon' type='control' />
                    </a>
                  </Tooltip>
                </Popover>
                <Tooltip title='取消过滤'>
                  <a disabled={!usingFilter} className='icon-btn' style={{ marginRight: 16 }}>
                    <Icon onClick={this.cancelFilter} className='icon-btn-icon' type='filter' theme='filled' />
                  </a>
                </Tooltip>
                <Tooltip title={panelVisible ? '关闭分析面板' : '打开分析面板'}>
                  <a className='icon-btn' style={{ marginRight: 16 }} onClick={this.togglePanel}>
                    <Icon type='area-chart'
                      className={classNames(
                        { 'icon-btn-icon': true },
                        { 'not-active': !panelVisible }
                      )}
                    />
                  </a>
                </Tooltip>
                <Radio.Group value={'tableView'}>
                  <Radio.Button value='tableView'>表格视图</Radio.Button>
                  <Radio.Button disabled value='boardView'>看板视图</Radio.Button>
                </Radio.Group>
              </div>
            </div>
          </div>
        </div>
        {
          !defaultFolder ?
            <div style={{ fontSize: 32, margin: 32 }}>
              <div>此团队没选择任何文件夹</div>
              <Link to={`${base}/settings/teams/${selectedTeam.id}/config#folder`}>去设置</Link>
            </div>
            :
            !selectedIteration ?
              <div style={{ fontSize: 32, margin: 32 }}>
                <div>此团队没选择任何迭代</div>
                <Link to={`${base}/settings/teams/${selectedTeam.id}/config#iteration`}>去设置</Link>
              </div>
              :
              <SplitPane split='vertical' className='split-pane' onChange={(size) => {
                const e = document.createEvent('Event');
                e.initEvent('resize', true, true);
                window.dispatchEvent(e);
                this.rememberSize(size);
              }}>
                <WorkItemTable
                  ref={ref => this.tableRef = ref}
                  excludedColumns={['迭代']}
                />
                {
                  !panelVisible ? null :
                    <Pane minSize='350px' maxSize='50%' size={panelWidth + 'px'}>
                      <AnalysisPanel width={panelWidth} toggle={this.togglePanel} />
                    </Pane>
                }
              </SplitPane>
        }
      </div >
    )
  }
}

export default ProjectIterations;
