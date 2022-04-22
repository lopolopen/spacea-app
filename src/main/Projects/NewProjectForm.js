import React, { Component } from 'react';
import { inject } from 'mobx-react';
import { Input, Modal, Form } from 'antd';
import _ from 'lodash'
import './style.less';

const { TextArea } = Input;

function hasErrors(fieldsError) {
  //getFieldsError()not respect custom errors
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}

@inject('appStore')
class NewProjectForm extends Component {
  state = {
    validateStatus: undefined,
    help: undefined
  }
  // handleSubmit(e) {
  //   e.preventDefault();
  //   this.props.form.validateFields((err, values) => {
  //     console.log(values);
  //   });
  // };

  debounceValidate = _.debounce((usedNames, name) => {
    if (usedNames.some(n => n === name)) {
      this.setState({
        validateStatus: 'error',
        help: '该项目名称已经被占用'
      });
    } else if (name !== '') {
      this.setState({
        validateStatus: undefined,
        help: undefined
      });
    }
  }, 500);

  validateName = (e) => {
    let { usedNames } = this.props;
    let name = e.target.value;
    this.debounceValidate(usedNames, name);
  };

  render() {
    let { form, visible, confirmLoading, onCancel, onOk, } = this.props;
    const { getFieldDecorator, getFieldsError } = form;
    let { validateStatus, help } = this.state;

    return (
      <Modal
        visible={visible}
        confirmLoading={confirmLoading}
        title="新建项目"
        maskClosable={false}
        onCancel={onCancel}
        onOk={onOk}
        okText={'确定'}
        cancelText={'取消'}
        okButtonProps={{ disabled: hasErrors(getFieldsError()) || hasErrors({ name: validateStatus }) }
        }
      >
        <Form layout="vertical">
          <label>名称</label>
          <Form.Item validateStatus={validateStatus} help={help}>
            {
              getFieldDecorator('name', {
                initialValue: null,
                rules: [
                  { required: true, whitespace: true, message: '项目名称不能为空' },
                  { max: 30, message: '项目名称不能超过20个字符' }
                ],
              })(<Input onChange={this.validateName} placeholder='项目名称' />)
            }
          </Form.Item>
          <label>描述</label>
          <Form.Item>
            {
              getFieldDecorator('desc', {
                initialValue: null,
                rules: [{ max: 250, message: '项目描述不能超过250个字符' }]
              })(<TextArea rows={5} placeholder='项目描述' />)
            }
          </Form.Item>
        </Form>
      </Modal >
    );
  }
}

export default NewProjectForm;
