import React from 'react';
import { Icon } from 'antd';
import md5 from 'md5';
import utility from '../../utility'

export default ({ path, icon }) => {
  let nodes = path.split('/').filter(n => n !== '');
  if (nodes.length === 0) return null;
  let color = utility.hashColor(md5(path));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <Icon style={{ color, fontSize: '1em' }} theme='filled' type={icon} />
      {
        nodes.map((n, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Icon style={{ fontSize: '0.5em', margin: '0 4px', opacity: 0.5 }} type='right' />{n}
          </span>
        ))
      }
    </span>
  );
}
