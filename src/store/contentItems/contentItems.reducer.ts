import { AnyAction } from 'redux';

import {
  SET_CONTENT_ITEMS,
  SET_CONTENT_ITEMS_PAGINATION,
  SET_FACETS,
  SET_FILTER,
} from './contentItems.actions';

import { ContentItemsInterface } from '../../types/types';

const defaultState = {
  data: [],
  facets: {
    repositories: [],
    contentTypes: [],
    assignees: [],
  },
  filter: {
    contentTypes: [],
    assignees: [],
    repositories: '',
    text: '',
  },
  pagination: { page: 0, totalCount: 0 },
};

export function contentItemsReducer(
  state = defaultState,
  action: AnyAction
): ContentItemsInterface {
  switch (action.type) {
    case SET_CONTENT_ITEMS:
      return {
        ...state,
        data: [...action.value],
      };
    case SET_CONTENT_ITEMS_PAGINATION:
      return {
        ...state,
        pagination: { ...action.value },
      };
    case SET_FACETS:
      return {
        ...state,
        facets: { ...action.value },
      };
    case SET_FILTER:
      return {
        ...state,
        filter: { ...action.value },
      };
    default:
      return state;
  }
}
