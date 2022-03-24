import { SelectedProjectConfigInterface } from '../../types/types';

export const SET_PROJECT = 'SET_PROJECT';
export const SET_PROJECTS = 'SET_PROJECTS';
export const SET_PROJECT_CONFIG = 'SET_PROJECT_CONFIG';

export const setProject = (value: string) => ({
  type: SET_PROJECT,
  value,
});

export const setProjectConfig = (value: SelectedProjectConfigInterface) => ({
  type: SET_PROJECT_CONFIG,
  value,
});
