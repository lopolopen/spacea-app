import React from 'react';
import { Badge } from 'antd';

const stateMap = {
  story: {
    'new': { status: 'default', text: '新建', defReason: '新建', textId: 'state_new' },
    'active': { status: 'blue', text: '实现中', defReason: '通过审核并开始实现', textId: 'state_active' },
    'resolved': { status: 'orange', text: '已实现', defReason: '编码完成并通过单元测试', textId: 'state_resolved' },
    'closed': { status: 'green', text: '结束', defReason: '已上线', textId: 'state_closed' },
    'removed': { status: 'red', text: '移除', defReason: '从工作积压中移除', textId: "state_removed" },
  },
  task: {
    'new': { status: 'default', text: '新建', defReason: '新建' },
    'active': { status: 'blue', text: '进行中', defReason: '工作开始' },
    'closed': { status: 'green', text: '完成', defReason: '工作完成' },
    'removed': { status: 'red', text: '移除', defReason: '从工作积压中移除' }
  },
  bug: {
    'new': { status: 'default', text: '新建', defReason: '新建' },
    'active': { status: 'blue', text: '修复中', defReason: '确认可重现' },
    'resolved': { status: 'orange', text: '已修复', defReason: '修复并重新发布' },
    'closed': { status: 'green', text: '关闭', defReason: '修复并通过测试' },
    'removed': { status: 'red', text: '移除', defReason: '从工作积压中移除' }
  }
};

export default ({ type, state, textFunc, ...restProps }) => {
  let { status, text, textId } = stateMap[type][state];
  textFunc = textFunc || (() => text);
  return <Badge status={status} text={textFunc(textId)} {...restProps} />;
};

export { stateMap };
