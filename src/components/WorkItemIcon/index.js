import React from 'react';
import { Icon } from 'antd';

const typeMap = {
  story: { icon: 'read', color: '#06c1f3', text: '故事' },
  task: { icon: 'carry-out', color: '#ffbe00', text: '任务' },
  bug: { icon: 'bug', color: '#e50707', text: 'Bug' }
};

export default ({ type, labeled, color, ...restProps }) => {
  let { icon, color: defaultColor, text } = type in typeMap ? typeMap[type] :
    { icon: 'question', color: 'grey', text: '未知' };
  return (
    <span  {...restProps}>
      <Icon type={icon} style={{ color: color || defaultColor }} />
      {labeled ? <span style={{ marginLeft: 8 }}>{text}</span> : null}
    </span>);
}

export { typeMap }
