/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import MemberAvatar from '../../../components/MemberAvatar';
import { Table, Icon, Popconfirm, Divider, Button, Input, Badge, Empty } from 'antd';
import { inject, observer } from 'mobx-react';
import Highlighter from 'react-highlight-words';

@inject('appStore')
@observer
class MembersSetting extends Component {

  columns;
  state = {
    selected: null,
    searchText: '',
    searchedColumn: '',
  };

  async componentDidMount() {
    let { appStore } = this.props;
    appStore.setSubName('MembersSetting');
    await appStore.loadMembers();
  }

  getColumnSearchProps = (dataIndex, getData) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          value={selectedKeys[0]}
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
    ),
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
      this.state.searchedColumn === dataIndex ?
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069' }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text || ''}
        />
        :
        text,
  });

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: '' });
  };

  constructor(props) {
    super(props);
    this.columns = [
      {
        title: 'ID',
        dataIndex: 'id'
      },
      {
        title: '用户名',
        dataIndex: 'accountName',
        ...this.getColumnSearchProps('accountName')
      },
      {
        title: '姓名',
        key: 'name',
        ...this.getColumnSearchProps('name', ({ xing, ming, firstName, lastName }) =>
          (xing && ming) ? `${xing} ${ming}` : `${firstName} ${lastName}`),
        render: (record) => {
          let { xing, ming, firstName, lastName } = record;
          return (
            <span>
              <MemberAvatar member={record} size={'small'} />
              <span style={{ marginLeft: '8px' }}>
                {
                  (xing && ming) ?
                    this.getColumnSearchProps('name').render(`${xing} ${ming}`)
                    :
                    this.getColumnSearchProps('name').render(`${firstName} ${lastName || ''}`.trim())
                }
              </span>
            </span>
          );
        }
      },
      {
        title: '状态',
        key: 'status',
        filters: [
          {
            text: <Badge status="success" text="启用" />,
            value: false,
          },
          {
            text: <Badge status="error" text="停用" />,
            value: true,
          },
        ],
        onFilter: (value, record) => {
          return value === record.disabled;
        },
        render: (record) => {
          return (
            <span>{!record.disabled ?
              <Badge status="success" text="启用" />
              :
              <Badge status="error" text="停用" />}
            </span>
          );
        }
      },
      {
        title: '操作',
        key: 'action',
        render: (record) => {
          let handleOk = async () => {
            const { appStore } = this.props;
            let { id, disabled } = record;
            await appStore.disableMember(id, !disabled);
          };
          return (
            <span>
              <a disabled onClick={null}><Icon type='edit' title="编辑" /></a>
              <Divider type="vertical" />
              {
                !record.disabled ?
                  <Popconfirm title={'确定停用当前成员吗?'} onConfirm={handleOk} >
                    <a><span title="停用"><Icon type='stop' /></span></a>
                  </Popconfirm>
                  :
                  <Popconfirm title={'确定启用当前成员吗?'} onConfirm={handleOk} >
                    <a><span title="启用"><Icon type='check' /></span></a>
                  </Popconfirm>
              }
            </span>
          );
        }
      },
    ];
  }

  render() {
    let { members } = this.props.appStore;
    let dataSource = members && members.filter(m => m.id > 0);
    let { selected } = this.state;
    return (
      <div className='MembersSetting'>
        <Table columns={this.columns} dataSource={dataSource} rowKey='id'
          rowClassName={({ id }) => selected === id ? 'ant-table-row-selected' : ''}
          onRow={
            ({ id }) => {
              return {
                onClick: e => {
                  this.setState({ selected: id });
                }
              }
            }}
          locale={{
            filterConfirm: <Button type='primary' icon='check' size="small" />,
            filterReset: <Button style={{ color: 'red' }} icon='close' size="small" />,
            emptyText: <Empty />
          }}
        />
      </div>
    );
  }
}

export default MembersSetting;
