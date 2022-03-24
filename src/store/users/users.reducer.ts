import { AnyAction } from 'redux';
import { SET_USERS } from './users.actions';
import { UserInterface } from '../../types/types';

export function usersReducer(
  state = {
    data: [],
  },
  action: AnyAction
): { data: UserInterface[] } {
  switch (action.type) {
    case SET_USERS:
      return {
        ...state,
        data: action.value as UserInterface[],
      };
    default:
      return state;
  }
}
