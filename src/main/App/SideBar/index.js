import React, { Component } from 'react';
import { observer } from 'mobx-react';
import NavMenu from '../../common/NavMenu';
import './style.less';

@observer
class SideBar extends Component {
  render() {
    let { projectId, ...rest } = this.props;
    let base = !projectId ? '' : `/projects/${projectId}`;
    return (
      <div className='SideBar'>
        <NavMenu base={base} mode='inline' {...rest} />
      </div>
    );
  }
}

export default SideBar;
