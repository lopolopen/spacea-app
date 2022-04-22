import React from 'react';
import { Tag } from 'antd';

const priorityMap = {
  high: { color: 'red', text: '高' },
  normal: { color: 'gold', text: '中' },
  low: { color: '', text: '低' }
};

export default ({ priority }) => {
  let { color, text } = priorityMap[priority];
  return <Tag style={{ minWidth: 32, textAlign: 'center' }} color={color}>{text}</Tag>
}

export { priorityMap };
