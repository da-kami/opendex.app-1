import { createMuiTheme, Theme } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import { createBrowserHistory } from 'history';
import { Provider } from 'react-redux';
import { Redirect, Route, Router, Switch } from 'react-router-dom';
import { store } from '../../store';
import HomePage from '../../pages/home';
import { Path } from './path';
import { theme } from './theme';
import { NetworkProvider } from '../../context/NetworkContext';
import React from 'react';

const history = createBrowserHistory();

function App() {
  return (
    <ThemeProvider theme={createMuiTheme((theme as unknown) as Theme)}>
      <CssBaseline />
      <NetworkProvider>
        <Provider store={store}>
          <Router history={history}>
            <Switch>
              <Route exact path={Path.HOME}>
                <HomePage />
              </Route>
              <Route path="*">
                <Redirect to={Path.HOME} />
              </Route>
            </Switch>
          </Router>
        </Provider>
      </NetworkProvider>
    </ThemeProvider>
  );
}

export default App;
