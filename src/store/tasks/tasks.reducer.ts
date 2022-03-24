import { AnyAction } from 'redux';
import { SET_TASKS, SET_TASKS_PAGINATION } from './tasks.actions';
import { Pagination, TaskInterface, TasksInterface } from '../../types/types';

const defaultState = {
  data: [],
  pagination: { page: 0, totalCount: 0 },
};

export function tasksReducer(
  state = defaultState,
  action: AnyAction
): TasksInterface {
  switch (action.type) {
    case SET_TASKS:
      return {
        ...state,
        data: [...(action.value as TaskInterface[])],
      };
    case SET_TASKS_PAGINATION:
      return {
        ...state,
        pagination: { ...(action.value as Pagination) },
      };
    default:
      return state;
  }
}
