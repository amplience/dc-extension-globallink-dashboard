import { AnyAction } from 'redux';
import { ContentType } from 'dc-management-sdk-js';
import { SET_CONTENT_TYPES } from './contentTypes.actions';

export function contentTypesReducer(
  state = {
    data: [],
  },
  action: AnyAction
): {
  data: ContentType[];
} {
  switch (action.type) {
    case SET_CONTENT_TYPES:
      return {
        ...state,
        data: action.value as ContentType[],
      };
    default:
      return state;
  }
}
