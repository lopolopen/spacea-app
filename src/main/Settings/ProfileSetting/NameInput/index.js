import React, { Component } from 'react';
import { Input } from 'antd';

class NameInput extends Component {
  updateFistName = e => {
    let { onChange, value } = this.props;
    onChange({
      firstName: e.target.value,
      lastName: value.lastName
    });
  }

  updateLastName = e => {
    let { onChange, value } = this.props;
    onChange({
      firstName: value.firstName,
      lastName: e.target.value
    });
  }

  updateXing = e => {
    let { onChange, value } = this.props;
    onChange({
      xing: e.target.value,
      ming: value.ming
    });
  }

  updateMing = e => {
    let { onChange, value } = this.props;
    onChange({
      xing: value.xing,
      ming: e.target.value
    });
  }

  render() {
    let { en, value } = this.props;
    value = value || {};
    let { firstName, lastName, xing, ming } = value;

    return (
      <div className='NameInput'>
        {
          en ?
            <Input.Group compact>
              <Input style={{ width: '50%' }} placeholder='Given Name' value={firstName} onChange={this.updateFistName} />
              <Input style={{ width: '50%' }} placeholder='Family Name' value={lastName} onChange={this.updateLastName} />
            </Input.Group>
            :
            <Input.Group compact>
              <Input style={{ width: '50%' }} placeholder='姓氏' value={xing} onChange={this.updateXing} />
              <Input style={{ width: '50%' }} placeholder='名子' value={ming} onChange={this.updateMing} />
            </Input.Group>
        }
      </div>
    );
  }
}

export default NameInput;
