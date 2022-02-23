import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { fetchSDK } from './store/sdk/sdk.actions';
import { store } from './store/store';
import App from './App';

import './styles/app.css';

store.dispatch(fetchSDK());
ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <App />
      </MuiPickersUtilsProvider>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
);
