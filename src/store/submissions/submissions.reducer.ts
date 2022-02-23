import { AnyAction } from 'redux';
import {
  SET_SUBMISSIONS,
  SET_PAGINATION,
  CHANGE_SUB_PAGE,
  SET_SELECTED_SUBMISSION,
  SET_SUB_FILTER,
} from './submissions.actions';
import { SubmissionsInterface } from '../../types/types';

const defaultState = {
  data: [],
  filter: {
    state: [],
    submitter: '',
    search_string: '',
    submission_name: '',
    is_error: 0,
    is_overdue: 0,
    is_redelivery: 0,
  },
  selectedSubmission: {},
  pagination: { page: 0, totalCount: 0 },
};

export function submissionsReducer(
  state = defaultState,
  action: AnyAction
): SubmissionsInterface {
  switch (action.type) {
    case SET_SUBMISSIONS:
      return {
        ...state,
        data: [...action.value],
      };
    case SET_SELECTED_SUBMISSION:
      return {
        ...state,
        selectedSubmission: action.value,
      };
    case SET_PAGINATION:
      return {
        ...state,
        pagination: { ...action.value },
      };
    case CHANGE_SUB_PAGE:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.value,
        },
      };
    case SET_SUB_FILTER:
      return {
        ...state,
        filter: { ...action.value },
      };
    default:
      return state;
  }
}
