import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Table, Switch } from 'antd';
import MemberAvatar from '../../../../../components/MemberAvatar';

@inject('appStore')
@observer
class AccessTokenManagement extends Component {
  render() {
    let { repoSettingStore } = this.props.appStore;
    let {
      accessTokens
    } = repoSettingStore;
    if (!accessTokens) return null;
    let columns = [{
      title: '令牌',
      dataIndex: 'desensitizedValue',
    }, {
      title: '属于',
      dataIndex: 'belongTo',
      render: (belongTo) => <MemberAvatar size='small' member={belongTo} />
    }, {
      title: '共享',
      dataIndex: 'isShared',
      render: (isShared, { ownerId }) => {
        return <Switch checked={isShared} onChange={async share => {
          await repoSettingStore.shareAccessTokenOrNot(ownerId, share);
        }} />
      }
    }, {
      title: '',
      width: '40%'
    }];
    return (
      <div>
        <div className='label'>项目成员的访问令牌</div>
        <div className='table-wrapper'>
          <Table rowKey='ownerId'
            size={'small'}
            columns={columns}
            dataSource={accessTokens}
            pagination={false}
          />
        </div>
      </div>
    );
  }
}

export default AccessTokenManagement;
