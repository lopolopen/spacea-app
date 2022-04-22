import React, { Component } from 'react';
import { Modal, Form, Input, DatePicker, TreeSelect } from 'antd';
import locale from 'antd/es/date-picker/locale/zh_CN';
import moment from 'moment';

const { RangePicker } = DatePicker;
class NewIterationForm extends Component {
  render() {
    let { form, iteration, iterationTree, visible, onOk, onCancel, confirmLoading, isEditing, isDeleting } = this.props;
    if (!iteration) return null;
    let { parent } = iteration;
    if (!parent) throw new Error('iteration must have parent');
    const { getFieldDecorator } = form;
    return (
      iteration &&
      <Modal
        title={isEditing ? '编辑' : isDeleting ? '删除' : '新建'}
        maskClosable={false}
        visible={visible}
        confirmLoading={confirmLoading}
        onOk={() => onOk(iteration, isEditing, isDeleting)}
        onCancel={onCancel}
        okButtonProps={{ type: isDeleting ? 'danger' : 'primary' }}
        okText={isDeleting ? '删除' : '保存'}
        cancelText={'取消'}
      >
        <div>
          <label>名称</label>
          <Form.Item>
            {
              getFieldDecorator('name', {
                initialValue: iteration.name,
                rules: [
                  { required: true, whitespace: true, message: '迭代名称不能为空' },
                  {
                    validator: (_, value, cb) => {
                      (value.includes('/') || value.includes('\\')) ? cb(true) : cb()
                    }, message: '迭代名称不能包含字符："/", "\\"'
                  }
                ]
              })(<Input disabled={isDeleting} placeholder='迭代名称' />)
            }
          </Form.Item>
        </div>
        <div>
          <label>周期</label>
          <Form.Item>
            {
              getFieldDecorator('range', {
                initialValue: [
                  iteration.startDate && moment(iteration.startDate),
                  iteration.endDate && moment(iteration.endDate)
                ],
                rules: [{ type: 'array' }],
              })(
                <RangePicker disabled={isDeleting} locale={locale}
                  format='YYYY-MM-DD'
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']} />
              )
            }
          </Form.Item>
        </div>
        <div style={{ fontSize: 24, marginBottom: 24, display: isDeleting ? '' : 'none' }}>
          <span>如果删除</span>
          <span style={{ color: '#0078d4', fontWeight: 'bold' }}>{iteration.name}</span>
          <span>，依赖它及其子级的所有工作事项将被转移到其它路径</span>
        </div>
        <div>
          <label>{!isDeleting ? '位置' : '转移到'} </label>
          <Form.Item>
            {
              getFieldDecorator('locationId', {
                initialValue: parent.id,
                rules: []
              })(
                <TreeSelect
                  disabled={!isDeleting}
                  // disabled={!isEditing && !isDeleting}
                  style={{ width: '100%' }}
                  treeData={iterationTree.children}
                  treeDefaultExpandAll
                  treeNodeLabelProp='path'
                />
              )
            }
          </Form.Item>
        </div>
      </Modal>
    );
  }
}

export default NewIterationForm;
