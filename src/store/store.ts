import thunkMiddleware, { ThunkMiddleware } from 'redux-thunk';
import logger from 'redux-logger';
import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import { StateType } from 'typesafe-actions';
import { errorReducer } from './error/error.reducer';
import { sdkReducer } from './sdk/sdk.reducer';
import { projectReducer } from './project/project.reducer';
import { submissionsReducer } from './submissions/submissions.reducer';
import { tasksReducer } from './tasks/tasks.reducer';
import { apiReducer } from './api/api.reducer';
import { loadingsReducer } from './loadings/loadings.reducer';
import { contentItemsReducer } from './contentItems/contentItems.reducer';
import { usersReducer } from './users/users.reducer';
import { contentTypesReducer } from './contentTypes/contentTypes.reducer';

export const rootReducer = combineReducers({
  sdk: sdkReducer,
  error: errorReducer,
  projects: projectReducer,
  submissions: submissionsReducer,
  tasks: tasksReducer,
  loadings: loadingsReducer,
  users: usersReducer,
  Api: apiReducer,
  contentItems: contentItemsReducer,
  contentTypes: contentTypesReducer,
});

export const store = createStore(
  rootReducer,
  compose(applyMiddleware(thunkMiddleware as ThunkMiddleware, logger))
);

export type AppDispatch = typeof store.dispatch;

export type RootState = StateType<typeof rootReducer>;
