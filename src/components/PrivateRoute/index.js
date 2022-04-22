import React, { Component } from 'react';
import { Route, Redirect, withRouter } from 'react-router-dom';

@withRouter
class PrivateRoute extends Component {
  render() {
    let { me, location, ...rest } = this.props;
    //me的值为undefined, null, {...}时分别具有不同的意义：
    //undefined: 一般是页面初始化
    //null: token不存在，或token无效（且刷新失败）
    //{...}: token验证成功
    if (undefined === me) return null;
    if (null === me) {
      return <Redirect to={{ pathname: '/sign_in', state: { from: location } }} />
    }

    return <Route {...rest} />
  }
}

export default PrivateRoute;
