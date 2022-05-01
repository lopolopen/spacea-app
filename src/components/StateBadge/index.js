import React from 'react';
import { Badge } from 'antd';

const stateMap = {
  story: {
    'new': { status: 'default', text: 'state_new', defReason: '新建' },
    'active': { status: 'blue', text: 'state_story_active', defReason: '通过审核并开始实现' },
    'resolved': { status: 'orange', text: 'state_story_resolved', defReason: '编码完成并通过单元测试' },
    'closed': { status: 'green', text: 'state_story_closed', defReason: '验收标准通过' },
    'removed': { status: 'red', text: 'state_removed', defReason: '从工作积压中移除' },
  },
  task: {
    'new': { status: 'default', text: 'state_new', defReason: '新建' },
    'active': { status: 'blue', text: 'state_task_active', defReason: '工作开始' },
    'closed': { status: 'green', text: 'state_task_closed', defReason: '工作完成' },
    'removed': { status: 'red', text: 'state_removed', defReason: '从工作积压中移除' },
  },
  bug: {
    'new': { status: 'default', text: 'state_new', defReason: '新建' },
    'active': { status: 'blue', text: 'state_bug_active', defReason: '确认可重现' },
    'resolved': { status: 'orange', text: 'state_bug_resolved', defReason: '修复并重新发布' },
    'closed': { status: 'green', text: 'state_bug_closed', defReason: '修复并通过测试' },
    'removed': { status: 'red', text: 'state_removed', defReason: '从工作积压中移除' },
  }
};

export default ({ type, state, textFunc, ...restProps }) => {
  let { status, text } = stateMap[type][state];
  return <Badge status={status} text={textFunc && textFunc(text)} {...restProps} />;
};

export { stateMap };
