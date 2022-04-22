import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Form, Avatar, Select } from 'antd';
import utility from '../../../../../utility';
import MemberAvatar from '../../../../../components/MemberAvatar';

const { Option } = Select;

@inject('appStore')
@observer
class LinkForm extends Component {
  state = {
    ownerId: undefined
  }

  async componentDidMount() {
    let { repoSettingStore } = this.props.appStore;
    await Promise.all([
      repoSettingStore.loadOwnedGitLabRepos(),
      repoSettingStore.loadJoinedGitLabRepos()
    ]);
  }

  handleOwnerChange = async (ownerId) => {
    this.setState({
      ownerId
    });
    let {
      form: { setFieldsValue },
      appStore: { repoSettingStore }
    } = this.props;
    setFieldsValue({
      ownedRepoIds: [],
      joinedRepoIds: []
    });
    await Promise.all([
      repoSettingStore.loadOwnedGitLabRepos(ownerId),
      repoSettingStore.loadJoinedGitLabRepos(ownerId)
    ]);
  }

  render() {
    let { form, appStore: { me, repoSettingStore } } = this.props;
    let { validAccessTokens, ownedRepos, joinedRepos, linkedRepos } = repoSettingStore;
    ownedRepos = ownedRepos || [];
    joinedRepos = joinedRepos || [];
    let linkedRepoIds = linkedRepos.map(r => r.id);
    let ownerId = this.state.ownerId || me.id;
    const { getFieldDecorator, getFieldValue } = form;
    let token = validAccessTokens.find(t => t.ownerId === ownerId);
    let owner = token && token.belongTo;
    let ownerName = owner ? <MemberAvatar member={owner} labelOnly /> : '';
    let neither = (getFieldValue('ownedRepoIds') || { length: 0 }).length === 0
      && (getFieldValue('joinedRepoIds') || { length: 0 }).length === 0;
    return (
      <div>
        <div className='label' style={{ marginTop: 0 }}>关联谁的仓库</div>
        <Select
          style={{ width: '100%' }}
          defaultValue={owner && owner.id}
          placeholder='请选择关联谁的仓库'
          onChange={this.handleOwnerChange}
        >
          {
            (validAccessTokens || []).map(({ ownerId, belongTo }) => (
              <Option key={ownerId} value={ownerId}>
                {
                  ownerId === me.id ?
                    <MemberAvatar.Me size='small' labeled />
                    :
                    <MemberAvatar member={belongTo} size={'small'} labeled />
                }
              </Option>
            ))
          }
        </Select>
        <Form layout='vertical'>
          {
            [{
              key: 'ownedRepoIds',
              label: '拥有',
              repos: ownedRepos.filter(r => !linkedRepoIds.includes(parseInt(r.id)))
            }, {
              key: 'joinedRepoIds',
              label: '参与',
              repos: joinedRepos.filter(r => !linkedRepoIds.includes(parseInt(r.id)))
            }].map(x => (
              <div key={x.key}>
                <div className='label'>{ownerName}{x.label}的仓库</div>
                <Form.Item>
                  {
                    getFieldDecorator(x.key, {
                      initialValue: [],
                      rules: [
                        { required: neither, message: '请选择被关联的仓库', type: 'array' }
                      ]
                    })(<Select
                      mode='multiple'
                      showArrow={true}
                      placeholder='请选择仓库'
                      optionLabelProp='label'
                      optionFilterProp='fullname'
                      filterOption={(input, option) => {
                        return option.props.fullname.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                      }}
                    >
                      {
                        (x.repos || []).map(({ id, name, nameWithNamespace }) =>
                          <Option key={id} label={name} fullname={nameWithNamespace}>
                            <Avatar style={{ backgroundColor: utility.hashColor(nameWithNamespace) }} shape='square' >
                              {name.charAt(0).toUpperCase()}
                            </Avatar>
                            <span style={{ marginLeft: 4 }}>{nameWithNamespace}</span>
                          </Option>)
                      }
                    </Select>)
                  }
                </Form.Item>
              </div>
            ))
          }
        </Form>
      </div>
    );
  }
}

export default LinkForm;
