import React, { Component } from 'react';
import { Input, Modal, Form, Select, Checkbox } from 'antd';
import { inject } from 'mobx-react';
import MemberAvatar from '../../../../components/MemberAvatar';
import { set } from '../../../../utility';

const { TextArea } = Input;
const { Option, OptGroup } = Select;

@inject('appStore')
class CreateOrEditForm extends Component {
  render() {
    let { form, team, visible, onOk, onCancel, confirmLoading, appStore } = this.props;
    // if (!visible) return null;
    let isEditing = team && team.id;
    const { getFieldDecorator, setFieldsValue, getFieldValue } = form;
    return (
      <Modal
        title={isEditing ? '编辑团队' : '新建团队'}
        maskClosable={false}
        visible={visible}
        confirmLoading={confirmLoading}
        onOk={() => onOk(team, isEditing)}
        onCancel={onCancel}
      >
        <Form layout='vertical'>
          <label>名称</label>
          <Form.Item>
            {
              getFieldDecorator('name', {
                initialValue: team && team.name,
                rules: [
                  { required: true, whitespace: true, message: '团队名称不能为空' },
                  { max: 30, message: '团队名称不能超过30个字符' }
                ],
              })(<Input placeholder='团队名称' />)
            }
          </Form.Item>
          <label>成员</label>
          <Form.Item>
            {
              getFieldDecorator('memberIds', {
                initialValue: (isEditing && team) ? team.members.map(m => m.id) : [],
                rules: [
                  { required: false, type: 'array' }
                ]
              })(
                <Select
                  mode='multiple'
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
                >
                  {
                    [
                      {
                        id: 0,
                        name: '所有用户',
                        members: appStore.members || []
                      }
                    ].map(({ id: gid, name, members }) => {
                      let idSetOfGroup = new Set(members.filter(m => !m.disabled).map(m => m.id));
                      return (
                        <OptGroup label={<Checkbox
                          {...(() => {
                            let valueSet = new Set(getFieldValue('memberIds'));
                            let interSize = set.intersection(idSetOfGroup, valueSet).size;
                            return {
                              indeterminate: interSize > 0 && interSize < members.length,
                              checked: members.length > 0 && interSize === members.length
                            };
                          })()}
                          onChange={({ target: { checked } }) => {
                            let valueSet = new Set(getFieldValue('memberIds'));
                            if (checked) {
                              setFieldsValue({
                                memberIds: [...set.union(valueSet, idSetOfGroup)]
                              })
                            } else {
                              setFieldsValue({
                                memberIds: [...set.difference(valueSet, idSetOfGroup)]
                              })
                            }
                          }}>{name}</Checkbox>} key={gid}>
                          {
                            members.map(member => {
                              let { id: mid, firstName, lastName } = member;
                              let name = `${firstName} ${lastName}`;
                              return (
                                <Option style={{ display: member.disabled ? 'none' : 'block' }}
                                  key={mid} value={mid} label={name} >
                                  <MemberAvatar member={member} size={'small'} labeled />
                                </Option>
                              )
                            })
                          }
                        </OptGroup>
                      );
                    })
                  }
                </Select>
              )
            }
          </Form.Item>

          <label>缩略名</label>
          <Form.Item>
            {
              getFieldDecorator('acronym', {
                initialValue: team && team.acronym,
                rules: [
                  { max: 3, message: '团队缩略名不能超过3个字符' }
                ],
              })(<Input placeholder='团队缩略名' />)
            }
          </Form.Item>
          <div className='label'>描述</div>
          <Form.Item>
            {
              getFieldDecorator('desc', {
                initialValue: team && team.desc,
                rules: [{ max: 250, message: '团队描述不能超过250个字符' }],
              })(<TextArea rows={5} placeholder='团队描述' />)
            }
          </Form.Item>
        </Form >
      </Modal >
    );
  }
}

export default CreateOrEditForm;
