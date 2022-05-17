import React from 'react';
import { Icon } from 'antd';

export default ({ fileName, ...restProps }) => {
  let ext, type, color;
  if (fileName) {
    let match = fileName.match(/\.[^.]+$/);
    if (match) {
      ext = match[0];
    }
  }
  switch (ext) {
    case '.doc':
    case '.docx':
      type = 'file-word';
      color = '#0078d4';
      break;
    case '.xls':
    case '.xlsx':
      type = 'file-excel';
      color = '#107c41';
      break;
    case '.ppt':
    case '.pptx':
      type = 'file-ppt';
      color = '#c43e1c';
      break;
    case '.pdf':
      type = 'file-pdf';
      color = '#c30b15';
      break;
    case '.txt':
      type = 'file-text';
      break;
    case '.md':
      type = 'file-markdown';
      break;
    case '.jpg':
    case '.jpeg':
      type = 'file-jpg';
      break;
    case '.png':
    case '.bmp':
    case '.gif':
    case '.svg':
      type = 'file-image';
      break;
    case '.zip':
      type = 'file-zip';
      color = '#f3d283';
      break;
    default:
      type = 'file';
      break;
  }
  return <Icon type={type} style={{ color }} {...restProps} />
}
