/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { autorun } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Row, Col, Divider, Table, Tooltip, Icon, Dropdown, Menu, Badge, Popover, Select, Button, InputNumber } from 'antd';
import classNames from 'classnames';
import update from 'immutability-helper';
import MemberAvater from '../../../../../components/MemberAvatar';
import './style.less';

const genKey = ({ memberId, ownerId, type, cachedKey }) => {
  return cachedKey || memberId || (ownerId + type);
};

@inject('appStore')
@observer
class CapacitySetting extends Component {
  state = {
    iterationId: undefined,
    selectedRowKey: null,
    expandedRowKeys: [],
    candidates: [],
    backup: null
  };

  componentDidMount() {
    let { teamConfigStore } = this.props.appStore;
    this.distructor = autorun(async () => {
      let { currentTeam, currentIteration } = teamConfigStore;
      if (!currentTeam) return;
      await teamConfigStore.loadCapacities(currentTeam.id, currentIteration && currentIteration.id);
    });

  }

  componentWillUnmount() {
    let { teamConfigStore } = this.props.appStore;
    teamConfigStore.clearCapacities();
    this.distructor && this.distructor();
  }

  toggleExpansion = (key, expanded) => {
    if (!key) return;
    let { expandedRowKeys } = this.state;
    let index = expandedRowKeys.indexOf(key);
    if (index >= 0) {
      if (expanded !== true) {
        this.setState({
          expandedRowKeys: update(expandedRowKeys, { $splice: [[index, 1]] })
        });
      }
    } else {
      if (expanded !== false) {
        this.setState({
          expandedRowKeys: [...expandedRowKeys, key]
        });
      }
    }
  }

  backup = () => {
    let { backup } = this.state;
    if (backup) return;
    const { appStore } = this.props;
    const { teamConfigStore } = appStore;
    let { currentCapacities } = teamConfigStore;
    this.setState({
      backup: JSON.stringify(currentCapacities),
    });
  }

  resetBackup = () => {
    this.setState({
      backup: null
    });
  }

  switchIteration = ({ key }) => {
    let { teamConfigStore } = this.props.appStore;
    let {
      currentTeam: { iterations }
    } = teamConfigStore;
    const iterationId = key;
    teamConfigStore.setCurrentIteration(iterations.find(i => i.id === iterationId));
  }

  render() {
    const { appStore } = this.props;
    const {
      project,
      teamConfigStore,
      metas,
    } = appStore;
    let {
      currentTeam,
      currentIteration,
      currentCapacities
    } = teamConfigStore;
    if (!currentTeam) return null;
    if (!currentCapacities) return null;
    let includedIds = currentCapacities.map(c => c.memberId);
    let { selectedIteration } = project;
    currentIteration = currentIteration || selectedIteration;
    let { iterations } = currentTeam;
    let {
      // selectedRowKey,
      expandedRowKeys,
      candidates,
      backup
    } = this.state;
    let { capacityType } = metas.enums;
    let capacityMap = new Map(capacityType.map(ct => [ct.value, ct.displayName]));
    this.columns = [{
      title: (
        <span>
          成员
          <Divider type='vertical' style={{ margin: '0 16px' }} />
          <span className='tabel-icon-btn-bar'>
            <Popover
              placement='right'
              trigger='click'
              content={(
                <div>
                  <Select
                    mode='multiple'
                    style={{ width: 300 }}
                    autoClearSearchValue={false}
                    defaultActiveFirstOption={false}
                    showArrow={false}
                    showSearch={true}
                    placeholder='选择团队成员'
                    optionFilterProp='label'
                    filterOption={(input, option) => {
                      let label = option.props.label;
                      if (typeof label !== 'string') {
                        label = label.props.children;
                      }
                      if (typeof label !== 'string') {
                        return false;
                      }
                      return label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                    }}
                    value={candidates}
                    onChange={values => {
                      this.setState({ candidates: values })
                    }}
                  >
                    {
                      currentTeam.members
                        .filter(m => !includedIds.includes(m.id))
                        .map(member => {
                          let { id: mid, firstName, lastName } = member;
                          let name = `${firstName} ${lastName}`;
                          return (
                            <Select.Option style={{ display: member.disabled ? 'none' : 'block' }}
                              key={mid} value={mid} label={name} >
                              <MemberAvater member={member} size={'small'} labeled />
                            </Select.Option>
                          )
                        })
                    }
                  </Select>
                  <Button type='primary' style={{ marginLeft: 16 }}
                    disabled={candidates.length === 0}
                    onClick={() => {
                      this.backup();
                      teamConfigStore.addMembers(candidates);
                      this.setState({
                        candidates: [],
                        expandedRowKeys: [...expandedRowKeys, ...candidates]
                      });
                    }}>
                    确定
                  </Button>
                </div>
              )}>
              <a>
                <Icon type='plus' style={{ color: 'green', marginRight: 4 }} />
                <span>增加</span>
              </a>
            </Popover>
            <a onClick={async () => {
              await teamConfigStore.saveCapacities(currentTeam.id, currentIteration.id);
              this.resetBackup();
            }} disabled={!backup}>
              <Icon type='save' style={{ marginRight: 4 }} />
              <span>保存</span>
            </a>
            <a disabled={!backup} onClick={() => {
              if (!backup) return;
              teamConfigStore.resetCapacities(JSON.parse(backup));
              this.setState({ backup: null, expandedRowKeys: [] });
            }}
            >
              <Icon type='undo' style={{ marginRight: 4 }} />
              <span>撤销</span>
            </a>
          </span>
        </span>
      ),
      dataIndex: 'memberId',
      render: (memberId) => {
        if (!memberId) return null;
        let member = currentTeam.members.find(m => m.id === memberId);
        return <MemberAvater size='small' member={member} labeled />
      }
    }, {
      title: <span style={{ width: 180, display: 'inline-block' }}>工作性质</span>,
      dataIndex: 'type',
      render: (type, record) => {
        if (type === undefined) {
          let types = [...new Set(record.capacities.map(c => c.type))];
          return types.map(t => capacityMap.get(t)).join('，');
        }
        return (
          <Select
            value={type}
            style={{ width: 90 }}
            onChange={(value) => {
              this.backup();
              teamConfigStore.changeCapacityType(record, value);
              this.forceUpdate();
            }}
          >
            {
              metas.enums.capacityType.map(ct =>
                <Select.Option key={ct.value} value={ct.value}>
                  {ct.displayName}
                </Select.Option>)
            }
          </Select>
        );
      }
    }, {
      title: '每日工时',
      dataIndex: 'hoursPerDay',
      render: (hoursPerDay, record) => {
        if (hoursPerDay === undefined) {
          return record.capacities.map(c => c.hoursPerDay).reduce((x, y) => x + y, 0)
        }
        return (
          <InputNumber min={0} max={24} step={0.5} value={hoursPerDay}
            onChange={(value) => {
              if (typeof (value) !== 'number') return;
              if (value === hoursPerDay) return;
              if (value > 24) value = 24;
              if (value < 0) value = 0;
              this.backup();
              teamConfigStore.changeCapacityHours(record, value);
              this.forceUpdate();
            }}
          />
        )
          ;
      }
    }, {
      title: '',
      render: (record) => {
        let { memberId, ownerId } = record;
        return memberId ?
          <span>
            <Tooltip title='删除成员'>
              <a onClick={() => {
                this.backup();
                teamConfigStore.removeMember(memberId);
              }}>
                <Icon style={{ color: 'red' }} type='close' />
              </a>
            </Tooltip>
            <Divider type='vertical' />
            <Tooltip title='新增工时'>
              <a onClick={() => {
                this.backup();
                teamConfigStore.addCapacity(memberId);
                this.setState({
                  expandedRowKeys: [...new Set([...expandedRowKeys, memberId])]
                });
              }}>
                <Icon type='plus' />
              </a>
            </Tooltip>
          </span>
          :
          <span>
            <Tooltip title='删除工时'>
              <a onClick={() => {
                this.backup();
                teamConfigStore.removeCapacity(ownerId, record);
                this.forceUpdate();
              }}>
                <Icon style={{ color: 'red' }} type='close' />
              </a>
            </Tooltip>
          </span>
      }
    }, {
      title: '',
      width: '20%'
    }];
    return (
      <div className='CapacitySetting'>
        <div className='label'>当前迭代</div>
        <Row>
          <Col span={8}>
            <Dropdown className='iteration-selector'
              overlay={(
                <Menu onClick={this.switchIteration}>
                  {
                    iterations.map(({ id, name }) => (
                      <Menu.Item key={id} className={classNames({ 'selected': currentIteration && id === currentIteration.id })}>
                        <Badge color={currentIteration && id === currentIteration.id ? '#1890ff' : '#d9d9d9'} text={`迭代 ${name}`} />
                      </Menu.Item>
                    ))
                  }
                </Menu>
              )} trigger={['click']}>
              <div>
                <Icon type='flag' style={{ marginRight: 4 }} />
                {`迭代 ${currentIteration ? currentIteration.name : '无'}`}
                <Icon style={{ paddingLeft: '4px' }} type='down' />
              </div>
            </Dropdown>
          </Col>
        </Row>
        <div>
          <div className='label'>团队成员生产工时管理</div>
          <div className='table-wrapper'>
            <Table
              rowKey={genKey}
              size='small'
              childrenColumnName='capacities'
              expandedRowKeys={expandedRowKeys}
              onExpand={(expanded, record) => this.toggleExpansion(genKey(record), expanded)}
              pagination={false}
              columns={this.columns}
              dataSource={currentCapacities}
            // rowClassName={record => classNames(
            //   { 'ant-table-row-selected': selectedRowKey === genKey(record) }
            // )}
            // onRow={(record) => ({
            //   onClick: () => {
            //     this.setState({
            //       selectedRowKey: genKey(record)
            //     });
            //   }
            // })}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default CapacitySetting;
