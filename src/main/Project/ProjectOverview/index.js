import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import './style.less';

@inject('appStore')
@observer
class ProjectOverview extends Component {
  componentDidMount() {
    this.props.appStore.setPageName('ProjectOverview');
  }

  render() {
    const { appStore: { project } } = this.props;
    return (project && project.id) ? (
      <div className='ProjectOverview'>
        {/* <div className='projectCover'><img alt={project.name} src={project.cover} /></div> */}
        <span className='projectName'>{project.name}</span>
        <div className='projectDescribe'>{project.desc}</div>
        {/* <div className='projectMembers'>
          {project.members.map((member, key) => {
            const { firstName, lastName } = member;
            const name = `${firstName} ${lastName}`
            const color = utility.hashColor(name);
            return (
              <Avatar style={{ backgroundColor: color, marginRight: '4px' }} title={name} key={key}>
                {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
              </Avatar>
            );
          })}
        </div> */}
      </div>
    ) : null;
  }
}

export default ProjectOverview;
