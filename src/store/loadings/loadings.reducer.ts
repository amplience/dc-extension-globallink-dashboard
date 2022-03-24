import { AnyAction } from 'redux';
import {
  SET_CONTENT,
  SET_TABLE,
  SET_CREATE,
  SET_LOADING_BY_ID,
} from './loadings.actions';
import { LoadingsInterface } from '../../types/types';

const defaultState = {
  content: false,
  table: false,
  create: false,
  loadingIds: {},
};

export function loadingsReducer(
  state = defaultState,
  action: AnyAction
): LoadingsInterface {
  switch (action.type) {
    case SET_CONTENT:
      return {
        ...state,
        content: Boolean(action.value),
      };
    case SET_TABLE:
      return {
        ...state,
        table: Boolean(action.value),
      };
    case SET_CREATE:
      return {
        ...state,
        create: Boolean(action.value),
      };
    case SET_LOADING_BY_ID:
      return {
        ...state,
        loadingIds: {
          ...state.loadingIds,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          [action.id || '']: action.value,
        },
      };
    default:
      return state;
  }
}
