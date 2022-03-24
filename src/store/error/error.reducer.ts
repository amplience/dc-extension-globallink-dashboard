import { AnyAction } from 'redux';
import { SET_ERROR } from './error.actions';

export function errorReducer(state = '', action: AnyAction): string {
  switch (action.type) {
    case SET_ERROR:
      return action.value as string;
    default:
      return state;
  }
}
