import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
// import { Link } from 'react-router-dom';

@inject('appStore')
@observer
class IntegrationSetting extends Component {
  componentDidMount() {
    this.props.appStore.setSubName('IntegrationSetting');
  }

  render() {
    return (
      <div>Integration Setting</div>
    );
  }
}

export default IntegrationSetting;
