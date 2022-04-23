import React from 'react';
import { Avatar, Icon } from 'antd';
import utility from '../../utility';
import { Member } from '../../stores/MemberStore';

const PUBLIC_URL = process.env.REACT_APP_PUBLIC_URL;

function getFullName(member) {
  let { xing, ming, firstName, lastName } = member;
  let name;
  if (xing && ming) {
    name = `${xing}${ming}`;
  }
  else {
    name = `${firstName} ${lastName}`;
  }
  return name;
}

let Me = ({ size, labeled, ...restProps }) => (
  <span {...restProps}>
    <Avatar style={{ background: 'white', border: '1px solid #888888' }} size={size} title={'自己'}>
      <span style={{ color: '#888888' }}>{'我'}</span>
    </Avatar>
    {
      labeled ? <span style={{ marginLeft: 6 }}>自己</span> : null
    }
  </span >
);

let Null = ({ size, labeled, ...restProps }) => (
  <span {...restProps}>
    <Avatar style={{ background: '#ccc' }} size={size} title='未分配'>
      <span style={{ color: 'white' }}>
        <Icon type='user' />
      </span>
    </Avatar>
    {
      labeled ? <span style={{ marginLeft: 6 }}>未分配</span> : null
    }
  </span >
);

let Outsider = ({ size, labeled, label, ...restProps }) => (
  <span {...restProps}>
    <Avatar style={{ background: '#ccc' }} size={size} title='非团队成员'>
      <span style={{ color: 'white' }}>
        <Icon type="close" />
      </span>
    </Avatar>
    {
      labeled ? <span style={{ marginLeft: 6 }}>{label}</span> : null
    }
  </span >
);

let MemberAvatar = ({ member, size, labeled, labelOnly, antiCache, ...restProps }) => {
  if (!member || member.id === null || member.id === undefined) {
    return <Null size={size} labeled={labeled} />
  }

  if (!member.avatar) {
    member = new Member(member);
  }

  let name, acronym, hashColor;
  let { avatar: { url, uid } } = member;
  //存在头像图片（且非只显示文本）
  if (url && !labelOnly) {
    if (!url.startsWith('data:')) {
      if (antiCache) {
        url = `${url}?u=${uid}`;
      }
      url = `${PUBLIC_URL}${url}`;
    }
    hashColor = '#ccc';
  }

  //用户被禁用（且非只显示文本）
  if (member.disabled && !labelOnly) {
    hashColor = '#0000';
    acronym = <Icon style={{ color: 'red' }} type="stop" />;
  }

  let { xing, ming, firstName, lastName, accountName } = member;
  if (xing && ming) {
    name = `${xing} ${ming}`;
    acronym = acronym || ming.charAt(ming.length - 1);
  }
  else {
    name = `${firstName || ''} ${lastName || ''}`;
    acronym = acronym || `${firstName ? firstName.charAt(0) : ''}${lastName ? lastName.charAt(0) : ''}`.toUpperCase()
  }
  hashColor = hashColor || utility.hashColor(`${accountName}`);

  //只显示文本
  if (labelOnly) {
    return <span style={{ color: hashColor }}>{name}</span>
  }
  return (
    <span className='member-avatar' {...restProps}>
      <Avatar size={size} title={name} src={url}
        style={{
          background: hashColor,
          fontSize: typeof size === 'number' ? size / 2 : undefined,
          color: 'white'
        }}
      >
        {acronym}
      </Avatar>
      {
        !labeled ? null :
          <span className='member-avatar-label' style={{ marginLeft: 6 }}>
            {name.trim()}
          </span>
      }
    </span>
  )
};

MemberAvatar.Null = Null;
MemberAvatar.Me = Me;
MemberAvatar.Outsider = Outsider;

export default MemberAvatar;
export { getFullName };
