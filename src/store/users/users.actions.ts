import { UserInterface } from '../../types/types';

export const SET_USERS = 'SET_USERS';

export const setUsers = (value: UserInterface[]) => ({
  type: SET_USERS,
  value,
});
