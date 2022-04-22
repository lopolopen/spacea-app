import React from 'react';

export default ({ maxWidth, children, text, titled }) => {
  return <span style={{
    display: 'inline-block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'bottom',
    maxWidth: maxWidth
  }} title={titled ? text : undefined}>{text || children}</span>
}
