import React from 'react';
import { Icon } from 'antd';

const typeMap = {
  story: { icon: 'read', color: '#06c1f3', text: '故事', textId: 'type_story' },
  task: { icon: 'carry-out', color: '#ffbe00', text: '任务', textId: 'type_task' },
  bug: { icon: 'bug', color: '#e50707', text: '缺陷', textId: 'type_bug' },
};

export default ({ type, labeled, color, textFunc, ...restProps }) => {
  let { icon, color: defaultColor, text, textId } = typeMap[type]
  textFunc = textFunc || (() => text);
  return (
    <span  {...restProps}>
      <Icon type={icon} style={{ color: color || defaultColor }} />
      {labeled ? <span style={{ marginLeft: 8 }}>{textFunc(textId)}</span> : null}
    </span>);
}

export { typeMap, }
