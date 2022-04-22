import React, { Component } from 'react';
import { Modal, Form, Input, TreeSelect } from 'antd';

class NewOrEditFolderForm extends Component {
  render() {
    let { form, folder, folderTree, visible, onOk, onCancel, confirmLoading, isEditing, isDeleting } = this.props;
    if (!folder || !folderTree) return null;
    let { parent } = folder;
    if (!parent) throw new Error('folder must have parent');
    const { getFieldDecorator } = form;
    return (
      folder &&
      <Modal
        title={isEditing ? '编辑' : isDeleting ? '删除' : '新建'}
        maskClosable={false}
        visible={visible}
        confirmLoading={confirmLoading}
        onOk={() => onOk(folder, isEditing, isDeleting)}
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
                initialValue: folder.name,
                rules: [
                  { required: true, whitespace: true, message: '文件夹名称不能为空' },
                  {
                    validator: (_, value, cb) => {
                      (value.includes('/') || value.includes('\\')) ? cb(true) : cb()
                    }, message: '文件夹名称不能包含字符："/", "\\"'
                  }
                ]
              })(<Input disabled={isDeleting} placeholder='文件夹名称' />)
            }
          </Form.Item>
        </div>
        <div style={{ fontSize: 24, marginBottom: 24, display: isDeleting ? '' : 'none' }}>
          <span>如果删除</span>
          <span style={{ color: '#0078d4', fontWeight: 'bold' }}>{folder.name}</span>
          <span>，依赖它及其子级的所有工作事项将被转移到其它路径</span>
        </div>
        <div>
          <label>{!isDeleting ? '位置' : '转移到'} </label>
          <Form.Item>
            {
              getFieldDecorator('locationId', {
                initialValue: parent.id,
                rules: []
              })(<TreeSelect
                disabled={!isDeleting}
                // disabled={!isEditing && !isDeleting}
                style={{ width: '100%' }}
                treeData={folderTree.children}
                treeDefaultExpandAll
                treeNodeLabelProp='path'
              />)
            }
          </Form.Item>
        </div>
      </Modal>
    );
  }
}

export default NewOrEditFolderForm;
