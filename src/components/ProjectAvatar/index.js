import React from 'react';
import { Avatar } from 'antd';
import utility from '../../utility';
import { Project } from '../../stores/ProjectStore';

const REACT_APP_PUB_BASE_URL =window._env_.REACT_APP_PUB_BASE_URL || process.env.REACT_APP_PUB_BASE_URL;

let ProjectAvatar = ({ project, size, labeled, labelOnly, antiCache, ...restProps }) => {
  if (!project || !project.id) return null;

  if (!project.avatar) {
    project = new Project(project);
  }

  let { name, avatar: { url, uid } } = project;
  let acronym;
  let hashColor;
  if (url) {
    if (!url.startsWith('data:')) {
      if (antiCache) {
        url = `${url}?u=${uid}`
      }
      url = `${REACT_APP_PUB_BASE_URL}${url}`;
    }
    hashColor = '#0000';
  }
  acronym = name && name.charAt(0).toUpperCase();
  hashColor = hashColor || utility.hashColor(name, 0.85);
  return (
    <span {...restProps}>
      <Avatar size={size} shape='square' src={url} title={name}
        style={{
          backgroundColor: hashColor,
          fontSize: size / 2,
          color: 'rgba(0, 0, 0, 0.6)'
        }}
      >
        {acronym}
      </Avatar>
      {
        !labeled ? null :
          <span style={{ marginLeft: 6 }}>
            {name}
          </span>
      }
    </span>
  )
}

export default ProjectAvatar;
