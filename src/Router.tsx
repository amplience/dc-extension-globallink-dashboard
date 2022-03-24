import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Router } from 'react-router';
import { history } from './App';
import AppBar from './components/AppBar';
import Loader from './components/common/Loader';
import SubmissionCreateForm from './components/SubmissionCreateForm';
import Tasks from './components/Tasks';
import Submissions from './components/Submissions';
import { RootState } from './store/store';
import { LoadingsInterface, SDKInterface } from './types/types';

const RouterComponent = () => {
  const {
    connected,
    loadings,
  }: {
    loadings: LoadingsInterface;
    connected: boolean;
  } = useSelector((state: RootState) => ({
    connected: (state.sdk as SDKInterface).connected,
    loadings: state.loadings,
  }));

  return connected ? (
    <Router history={history}>
      <AppBar />

      {loadings.table ? (
        <Loader />
      ) : (
        <Switch>
          <Route exact path="/create">
            <SubmissionCreateForm />
          </Route>
          <Route exact path="/tasks">
            <Tasks />
          </Route>
          <Route path="/">
            <Submissions />
          </Route>
        </Switch>
      )}
    </Router>
  ) : (
    <Loader className="content-loader" />
  );
};

export default RouterComponent;
