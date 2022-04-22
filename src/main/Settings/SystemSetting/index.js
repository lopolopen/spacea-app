import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

@inject('appStore')
@observer
class SystemSetting extends Component {
  componentDidMount() {
    this.props.appStore.setSubName('SystemSetting');
  }

  render() {
    return (
      <div>System Setting</div>
    );
  }
}

export default SystemSetting;
