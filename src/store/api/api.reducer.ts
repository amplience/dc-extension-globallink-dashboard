import { AnyAction } from 'redux';
import { SET_API } from './api.actions';

export function apiReducer(
  state = {
    apiKey: '',
  },
  action: AnyAction
): any {
  switch (action.type) {
    case SET_API:
      return action.value;
    default:
      return state;
  }
}
