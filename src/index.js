import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import { BrowserRouter } from 'react-router-dom';
import { AppWrapper } from './main/App';
import appStore from './stores/AppStore';
import * as serviceWorker from './serviceWorker';

import './index.less';

ReactDOM.render(
  <Provider appStore={appStore}>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
