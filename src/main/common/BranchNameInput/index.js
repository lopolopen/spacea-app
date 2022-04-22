import React, { Component } from 'react';
import { Input, Select } from 'antd';

const { Option } = Select;

class BranchNameInput extends Component {
  handlePrefixChange = prefix => {
    this.triggerChange({ prefix });
  }

  handleBodyChange = e => {
    this.triggerChange({ body: e.target.value });
  }

  triggerChange = changedValue => {
    const { onChange, value } = this.props;
    if (onChange) {
      onChange({
        ...value,
        ...changedValue
      });
    }
  };

  render() {
    const { value: { prefix, body }, workItem } = this.props;
    return (
      <Input.Group compact>
        <Select value={prefix} style={{ width: 100 }} suffixIcon='/'
          onChange={this.handlePrefixChange}>
          {
            [workItem.type, 'feat', 'hotfix']
              .map(p => <Option key={p} value={p}>{p}</Option>)
          }
        </Select>
        <Input disabled value={`#${workItem.id}-`} style={{ width: 100 }} />
        <Input value={body} style={{ width: 'calc(100% - 200px)' }}
          onChange={this.handleBodyChange} placeholder='请输入分支名称主体' />
      </Input.Group>
    );
  }
}

export default BranchNameInput;
