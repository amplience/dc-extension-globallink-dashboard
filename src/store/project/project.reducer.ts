import { AnyAction } from 'redux';
import {
  SET_PROJECT,
  SET_PROJECTS,
  SET_PROJECT_CONFIG,
} from './project.actions';
import {
  Project,
  ProjectStateInterface,
  SelectedProjectConfigInterface,
} from '../../types/types';

const defaultState: ProjectStateInterface = {
  data: [],
  selectedProject: '',
  selectedProjectConfig: {},
};

export function projectReducer(
  state = defaultState,
  action: AnyAction
): ProjectStateInterface {
  switch (action.type) {
    case SET_PROJECT:
      return {
        ...state,
        selectedProject: action.value as string,
      };
    case SET_PROJECTS:
      // eslint-disable-next-line no-case-declarations,@typescript-eslint/no-unsafe-member-access
      const project: Project | null =
        action.value && action.value.length
          ? (action.value[0] as Project)
          : null;
      return {
        ...state,
        data: [...(action.value as Project[])],
        selectedProject: project ? project.connector_key : '',
      };
    case SET_PROJECT_CONFIG:
      return {
        ...state,
        selectedProjectConfig: {
          ...action.value,
        } as SelectedProjectConfigInterface,
      };
    default:
      return state;
  }
}
