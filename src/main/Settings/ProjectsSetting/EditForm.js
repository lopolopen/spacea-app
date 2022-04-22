import React, { Component } from 'react';
import { Input, Modal, Form } from 'antd';

const { TextArea } = Input;

class EditForm extends Component {
  // handleSubmit(e) {
  //   e.preventDefault();
  //   this.props.form.validateFields((err, values) => {
  //     console.log(values);
  //   });
  // };

  render() {
    let { form, project, visible, onOk, onCancel, confirmLoading } = this.props;
    const { getFieldDecorator } = form;
    return (
      !project ? null :
        <Modal
          title="编辑"
          maskClosable={false}
          visible={visible}
          confirmLoading={confirmLoading}
          onOk={onOk}
          onCancel={onCancel}>
          <Form layout='vertical'>
            <label>名称</label>
            <Form.Item>
              {
                getFieldDecorator('name', {
                  initialValue: project.name,
                  //TODO: 一些特殊字符可能产生不良影响
                  rules: [
                    { required: true, whitespace: true, message: '项目名称不能为空' },
                    { max: 30, message: '项目名称不能超过30个字符' }
                  ],
                })(<Input placeholder='项目名称' />)
              }
            </Form.Item>
            <div className='label'>描述</div>
            <Form.Item>
              {
                getFieldDecorator('desc', {
                  initialValue: project.desc,
                  rules: [{ max: 250, message: '项目描述不能超过250个字符' }],
                })(<TextArea rows={5} placeholder='项目描述' />)
              }
            </Form.Item>
          </Form>
        </Modal>
    );
  }
}

export default EditForm;
