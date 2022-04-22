import React, { Component } from 'react';
import { Card, Icon, Empty, Spin } from 'antd';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import Highlighter from 'react-highlight-words';
import Moment from 'react-moment';
import classNames from 'classnames';
import MemberAvatar from '../../../components/MemberAvatar';
import ProjectAvatar from '../../../components/ProjectAvatar';
import './style.less';

const { Meta } = Card;

export default class CardView extends Component {
  render() {
    let { projects, loading, keys } = this.props;
    if (keys) {
      if (keys.length === 0) {
        projects = [];
      }
      else {
        projects = projects.filter(({ name, desc }) => {
          for (let key of keys) {
            if (name.toLowerCase().includes(key.toLowerCase())) return true;
            if (desc && desc.toLowerCase().includes(key.toLowerCase())) return true;
          }
          return false;
        })
      }
    }
    let hasProjects = projects && projects.length > 0;
    return (
      <div className={classNames(
        { 'CardView': !loading, },
        { 'no-card': !hasProjects }
      )}>
        {
          loading ?
            <div style={{ textAlign: 'center', padding: '40px 0', background: '#fff' }} >
              <Spin />
            </div> :
            !hasProjects ? <Empty style={{ background: '#fff' }} /> :
              projects.map(project => {
                let { id, name, desc, createdDate, owner, members } = project;
                return (
                  <Card className='card'
                    key={id}
                    hoverable={true}
                    actions={[
                      <MemberAvatar member={owner} />,
                      <div className='team-part-list'>
                        <span>
                          {
                            members
                              .filter(m => !m.disabled)
                              .map((m) => {
                                return (
                                  <MemberAvatar key={m.id} member={m} style={{ marginRight: '4px' }} size='small' />
                                )
                              })
                          }
                        </span>
                      </div>,
                      <Link to={`/projects/${id}/settings/teams`}>
                        <Icon type='setting' />
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={
                        <div>
                          <Link to={`/projects/${id}`}>
                            <ProjectAvatar size={64} project={project} />
                          </Link>
                        </div>
                      }
                      title={
                        <span className='title'>
                          <Link className='link' to={`/projects/${id}`} title={name}>
                            <Highlighter
                              highlightStyle={{ backgroundColor: '#ffc069' }}
                              searchWords={keys || []}
                              autoEscape
                              textToHighlight={name}
                            />
                          </Link>
                          {/* <Divider type="vertical" /> */}
                          <span className='date'>
                            <Moment format='YYYY-MM-DD'>{createdDate}</Moment>
                          </span>
                        </span>
                      }
                      description={
                        <Highlighter
                          highlightStyle={{ backgroundColor: '#ffc069' }}
                          searchWords={keys || []}
                          autoEscape
                          textToHighlight={desc || ''}
                        />
                      }
                    />
                  </Card>
                );
              })
        }
        {
          _.range(projects.length + 2).map(x => <div key={`_${x}`} className='card empty' />)
        }
      </div>
    );
  }
}
