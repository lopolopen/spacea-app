/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Icon, Tag, Menu, Select, Dropdown, Input, Button, message, Tooltip } from 'antd';
import copy from 'copy-to-clipboard';
import Highlighter from 'react-highlight-words';
import Truncate from '../../../components/Truncate';
import WorkItemIcon, { typeMap } from '../../../components/WorkItemIcon';
import { WorkItem } from '../../../stores/WorkItemStore';
import StateBadge, { stateMap } from '../../../components/StateBadge';
import PriorityTag, { priorityMap } from '../../../components/PriorityTag';
import MemberAvatar from '../../../components/MemberAvatar';
import Path from '../../../components/Path';
import Operations from './Operations';
import './style.less';

const { Option, OptGroup } = Select;

function defineColumns() {

  const { appStore, intl } = this.props;
  const { project, workItemStore, analysisStore } = appStore;
  if (!project) return null;
  let { selectedTeam } = project;
  let { defaultFolder } = selectedTeam;
  let { state } = this;
  const {
    usingFilter,
    filters
  } = state;


  this.partialUpdate = async (id, options) => {
    await workItemStore.partialUpdateWorkItem(id, options);
    analysisStore.refreshPanel();
    this.forceUpdate();
  }

  this.showNewBranchModel = async (workItem) => {
    const { appStore: { project } } = this.props;
    await project.loadRepos();
    workItemStore.setWorkItem(workItem);
    this.setState({
      nbm_visible: true
    });
  }

  this.handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  this.handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: '' });
  };

  this.getColumnSearchProps = (dataIndex, getData) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
      return <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          value={selectedKeys && selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 160, marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          icon="search"
          size="small"
        />
        <Button
          icon='close'
          onClick={() => this.handleReset(clearFilters)}
          size="small"
          style={{ float: 'right', color: 'red' }}
        />
      </div>
    }
    ,
    filterIcon: filtered => (
      <Icon type="search" style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      let data = getData && getData(record);
      data = data || record[dataIndex];
      if (!data) return false;
      return data
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase());
    },
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
    render: text =>
      this.state.filters[dataIndex] && this.state.searchedColumn === dataIndex ?
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069' }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text || ''}
        />
        :
        text,
  });

  this.getFilters = (dataIndex) => {
    switch (dataIndex) {
      case 'state': {
        let types = Object.keys(stateMap);
        return types.flatMap(t => {
          let states = Object.keys(stateMap[t]).filter(s => s !== 'removed');
          return states.map(s => {
            return {
              value: t + s,
              text: (
                <span>
                  <WorkItemIcon style={{ marginRight: 8 }} type={t} />
                  <StateBadge type={t} state={s} />
                </span>
              )
            }
          })
        });
      }
      case 'type': {
        let types = Object.keys(typeMap);
        return types.map(t => {
          return {
            value: t,
            text: <WorkItemIcon type={t} textFunc={(id) => intl.formatMessage({ id })} labeled />
          }
        });
      }
      case 'priority':
        let priorities = Object.keys(priorityMap);
        return priorities.map(p => {
          return {
            value: p,
            text: <PriorityTag priority={p} />
          }
        });
      case 'assigneeId': {
        let {
          me,
          project: { teams },
          workItemStore: { workItems }
        } = this.props.appStore;
        let memberMap = new Map(
          (teams || []).flatMap(t => t.members)
            .filter(m => m.id !== me.id)
            .map(m => [m.id, m])
        );
        let allIds = new Set((workItems || []).map(wi => wi.assigneeId));
        allIds.delete(null);
        allIds.delete(0);
        allIds.delete(me.id);
        let filters = [...allIds]
          .map(id => ({
            value: id || 0,
            text: memberMap.has(id) ?
              <MemberAvatar member={memberMap.get(id)} size={'small'} labeled /> :
              <MemberAvatar.Outsider size={'small'} label={id} labeled />
          }));
        return [{
          value: me.id || '?',
          text: <MemberAvatar.Me size={'small'} labeled />
        }, {
          //内部会调用value.toString()，所以不能为null
          value: 0,
          text: <MemberAvatar.Null size={'small'} labeled />
        },
        ...filters];
      }
      case 'creator': {
        let { me, workItemStore: { workItems } } = this.props.appStore;
        let filters = [
          ...new Map(
            (workItems || []).map(wi => wi.creator)
              .filter(c => c.id !== me.id)
              .map(c => [c.id, c])
          ).values()
        ].map(c => ({
          value: c.id,
          text: <MemberAvatar member={c} labelOnly />
        }));
        return [{
          value: me.id || '?',
          text: <MemberAvatar.Me size={'small'} labeled />
        },
        ...filters];
      }
      case 'tags': {
        let { workItemStore: { workItems } } = this.props.appStore;
        let tags = (workItems || []).flatMap(wi => wi.tags);
        return [{ text: 'prod', color: 'red' }, ...tags].map(tag => ({
          value: tag.text,
          text: (
            <Tag color={tag.color} title={tag.text}>
              {tag.text.length > 10 ? tag.text.slice(0, 5) + '...' : tag.text}
            </Tag>
          )
        }));
      }
      default:
        return [];
    }
  };

  return [
    // {
    //   title: 'Order',
    //   dataIndex: 'order'
    // },
    // {
    //   title: 'LongOrder',
    //   dataIndex: 'longOrder'
    // },
    {
      title: 'ID',
      dataIndex: 'id',
      filteredValue: filters.id || null,
      ...this.getColumnSearchProps('id'),
      render: (id) => (
        <Tooltip title='复制ID'>
          <span className='workitem-id'
            ref={(ref => this.idRefMap.set(id, ref))}
            onClick={() => {
              copy(id);
              message.info('ID已复制到剪贴板');
            }}>
            {this.getColumnSearchProps('id').render(id.toString())}
          </span>
        </Tooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'column_title' }),
      dataIndex: 'title',
      filteredValue: filters.title || null,
      ...this.getColumnSearchProps('title'),
      render: (title, record) => {
        title = this.getColumnSearchProps('title').render(title);
        return (
          <span className='row-content'>
            <WorkItemIcon className='workitem-icon'
              type={record.type}
              style={{ marginRight: 6 }}
            />
            <span className='workitem-title'>
              <span onClick={() => this.showWorkItemModel(record)}>
                <Truncate text={title} maxWidth={400} titled />
              </span>
            </span>
          </span>
        );
      }
    },
    {
      title: '',
      width: 16,
      render: (record) => {
        if (usingFilter) return null;
        return (
          record.loading ?
            <span>
              <Icon style={{ color: '#1890ff' }} type='sync' spin />
            </span>
            :
            !record.willBeShown ?
              <Tooltip title='刷新后该工作事项将会从视图中消失'>
                <Icon type='exclamation-circle' />
              </Tooltip>
              :
              (
                record.type !== 'story' ? null :
                  <Tooltip title='新建子项'>
                    <Dropdown trigger={['click']} overlay={
                      <Menu>
                        {
                          Object.keys(typeMap).map(type => (
                            <Menu.Item key={type}
                              onClick={() => this.showWorkItemModel(
                                new WorkItem({
                                  type,
                                  title: null,
                                  state: 'new',
                                  reason: '新建',
                                  priority: 'normal',
                                  parentId: record.id,
                                  //TODO:
                                  folder: defaultFolder,
                                  folderId: defaultFolder.id,
                                  iterationId: record.iterationId,
                                })
                              )
                              }
                            >
                              <WorkItemIcon type={type} textFunc={(id) => intl.formatMessage({ id })} labeled />
                            </Menu.Item>
                          ))
                        }
                      </Menu >
                    }>
                      <a><Icon className='btn-new-workitem' type="plus" /></a>
                    </Dropdown >
                  </Tooltip>
              )
        )
      }
    },
    {
      title: intl.formatMessage({ id: 'column_type' }),
      dataIndex: 'type',
      filteredValue: filters.type || null,
      filters: this.getFilters('type'),
      onFilter: (value, { type }) => value === type,
      render: (type) => {
        let item = typeMap[type]
        return intl.formatMessage({ id: item.textId })
      }
    },
    {
      title: intl.formatMessage({ id: 'column_state' }),
      dataIndex: 'state',
      filters: this.getFilters('state'),
      filteredValue: filters.state || null,
      onFilter: (value, { state, type }) => value === type + state,
      render: (state, { id, type, remainingHours, completedHours }) => {
        return (
          <Select
            // showArrow={false}
            value={state}
            size='small'
            onChange={(state) => {
              let reason = stateMap[type][state].defReason;
              if (state === 'closed' && (type === 'bug' || type === 'task'))
                this.partialUpdate(id, {
                  state,
                  reason,
                  remainingHours: 0,
                  completedHours: remainingHours === undefined ?
                    completedHours
                    :
                    remainingHours + (completedHours || 0)
                });
              else
                this.partialUpdate(id, { state, reason });
            }}
            dropdownClassName='drop-down'
            className='stateBadge'
          >
            {
              Object.keys(stateMap[type]).map(s =>
                <Option key={s} value={s}>
                  <StateBadge state={s} type={type} textFunc={(id) => intl.formatMessage({ id })} />
                </Option>
              )
            }
          </Select>
        )
      }
    },
    {
      title: intl.formatMessage({ id: 'column_priority' }),
      dataIndex: 'priority',
      filteredValue: filters.priority || null,
      filters: this.getFilters('priority'),
      onFilter: (value, { priority }) => {
        return value === priority;
      },
      render: (priority, { id }) => {
        let priorities = ['high', 'normal', 'low']
        return (
          <Select
            // showArrow={false}
            value={priority}
            size='small'
            onChange={(priority) => this.partialUpdate(id, { priority })}
            dropdownClassName='drop-down-fix'
            className='priorityTag'
          >
            {
              priorities.map(p => <Option key={p} value={p}>
                <PriorityTag priority={p} />
              </Option>)
            }
          </Select>
        )
      }
    },
    {
      title: intl.formatMessage({ id: 'column_assigned_to' }),
      dataIndex: 'assigneeId',
      filteredValue: filters.assigneeId || null,
      filters: this.getFilters('assigneeId'),
      onFilter: (value, { assigneeId }) => {
        return value === (assigneeId || 0);
      },
      render: (assigneeId, { id }) => {
        const { appStore: { project, project: { teams } } } = this.props;
        if (!project || !project.teams) return null;
        teams.sort((t, _) => t.id === project.selectedTeamId ? -1 : 0);
        return (
          <Select
            showSearch={true}
            style={{ width: 'auto', minWidth: '120px' }}
            value={assigneeId}
            dropdownClassName='drop-down'
            className='assigned-to'
            optionFilterProp='label'
            onChange={(assigneeId) => this.partialUpdate(id, { assigneeId })}
            filterOption={(input, option) => {
              return option.props.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {
              <Option key={null} value={null} label={'未分配'}>
                <MemberAvatar member={{ id: null }} size={'small'} labeled />
              </Option>
            }
            {
              teams.map(({ id: tid, name, members }) => {
                return (
                  <OptGroup label={name} key={tid}>
                    {
                      [...members].map((assignee) => {
                        let { id: mid, firstName, lastName } = assignee;
                        let name = `${firstName} ${lastName}`;
                        return (
                          <Option disabled={assignee.disabled}
                            style={{ display: assignee.disabled ? 'none' : 'block' }}
                            key={mid} value={mid} label={name}
                          >
                            <MemberAvatar member={assignee} size={'small'} labeled />
                          </Option>
                        )
                      })
                    }
                  </OptGroup>
                )
              })
            }
          </Select >
        )
      }
    },
    {
      title: intl.formatMessage({ id: 'column_remaining_hours' }),
      render: (record) => {
        let remain_rec = (workItem) => {
          let { remainingHours, type, state, children } = workItem;
          if (state === 'closed') return 0;
          if (type === 'bug' || type === 'task') {
            return remainingHours;
          }
          if (type === 'story') {
            let hours = undefined;
            for (let child of (children || [])) {
              let subHours = remain_rec(child);
              if (hours !== undefined || subHours !== undefined) {
                hours = (hours || 0) + (subHours || 0);
              }
            }
            return <span style={{ color: '#06c1f3' }}>{hours}</span>;
          }
        };
        let remainingHours = remain_rec(record);
        return remainingHours;
      },
      flagId: 'rh'
    },
    {
      title: intl.formatMessage({ id: 'column_iteration' }),
      dataIndex: 'iterationId',
      render: (iterationId) => {
        const { appStore: { project: { iterations } } } = this.props;
        if (!iterations) return null;
        let iteration = iterations.find(i => i.id === iterationId);
        return iteration && <Path path={iteration.path} icon='flag' />
      },
      flagId: 'i'
    },
    {
      title: intl.formatMessage({ id: 'column_folder' }),
      dataIndex: 'folderId',
      render: (folderId) => {
        const { appStore: { project: { folders } } } = this.props;
        if (!folders) return null;
        let folder = folders.find(f => f.id === folderId);
        return folder && <Path path={folder.path} icon='folder' />
      },
      flagId: 'f'
    },
    {
      title: intl.formatMessage({ id: 'column_created_by' }),
      dataIndex: 'creator',
      filteredValue: filters.creator || null,
      filters: this.getFilters('creator'),
      onFilter: (value, { creator }) => {
        return value === creator.id;
      },
      render: (creator) => <MemberAvatar member={creator} labelOnly />
    },
    // {
    //   title: '父级ID',
    //   dataIndex: 'parentId',
    //   render: (parentId) => parentId || '无'
    // },
    {
      title: intl.formatMessage({ id: 'column_tags' }),
      dataIndex: 'tags',
      filteredValue: filters.tags || null,
      filters: this.getFilters('tags'),
      onFilter: (value, { tags, isProd }) => {
        if (value === 'prod') return isProd;
        let texts = tags.flatMap(t => t.text);
        return texts.includes(value);
      },
      render: (tags, { isProd }) => {
        tags = tags || []
        if (isProd) {
          tags = [{ text: 'prod', color: 'red' }, ...tags];
        }
        return (
          tags.map((tag, idx) => (
            <Tag key={idx} color={tag.color} title={tag.text}>
              {tag.text.length > 10 ? tag.text.slice(0, 5) + '...' : tag.text}
            </Tag>))
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'column_created_by' }),
      key: 'action',
      render: (record) => (
        <Operations
          record={record}
          assignedTo={record.assignedTo}
          onEditWorkItem={() => this.showWorkItemModel(record)}
          onNewBranch={() => this.showNewBranchModel(record)}
          onDeleteWorkItem={() => this.deleteWorkItem(record)}
          onCopyWorkItem={() => this.showWorkItemModel(new WorkItem({ ...record, id: null }, appStore))}
        />
      )
    }
  ];
}

export { defineColumns };
