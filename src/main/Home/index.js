import React, { Component } from 'react';
import { inject } from 'mobx-react';

@inject('appStore')
class Home extends Component {

  componentDidMount() {
    let { appStore } = this.props;
    appStore.setPageName('Home');
  }

  render() {
    return (
      <div>
        Welcome to Co-Platform!
      </div>

    );
  }
}

export default Home;
