import React from 'react';
import { Icon } from 'antd';

const typeMap = {
  story: { icon: 'read', color: '#06c1f3', text: 'type_story' },
  task: { icon: 'carry-out', color: '#ffbe00', text: 'type_task' },
  bug: { icon: 'bug', color: '#e50707', text: 'type_bug' },
};

export default ({ type, labeled, color, textFunc, ...restProps }) => {
  let { icon, color: defaultColor, text } = typeMap[type]
  return (
    <span  {...restProps}>
      <Icon type={icon} style={{ color: color || defaultColor }} />
      {labeled ? <span style={{ marginLeft: 8 }}>{textFunc && textFunc(text)}</span> : null}
    </span>);
}

export { typeMap, }
