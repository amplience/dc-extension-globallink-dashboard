import { DashboardExtension, init } from 'dc-extensions-sdk';
import { Dispatch } from 'redux';
import axios from 'axios';
import { DynamicContent } from 'dc-management-sdk-js';
import GCCRestApi from '../../utils/GCCRestApi';
import { setError } from '../error/error.actions';
import {
  SET_PROJECTS,
  setProject,
  setProjectConfig,
} from '../project/project.actions';
import { setApi } from '../api/api.actions';
import { setUsers } from '../users/users.actions';
import { ParamsInt, Project, SDKInterface } from '../../types/types';
import { defaultSdk } from './sdk.reducer';

export const SET_SDK = 'SET_SDK';
export const MAX_PROJECTS = 10;

export const setSDK = (value: SDKInterface) => ({
  type: SET_SDK,
  value,
});

export const fetchSDK = () => async (dispatch: Dispatch) => {
  try {
    const extension: DashboardExtension = await init();
    const params: ParamsInt = {
      ...defaultSdk.params,
      ...extension.params.installation,
      ...extension.params.instance,
    };

    if (!params.apiKey || !params.apiUrl) {
      return dispatch(setError('Missing required installation parameters'));
    }

    axios.defaults.baseURL = params.apiUrl;

    const sdkInited = {
      SDK: extension,
      params,
      connected: true,
      dcManagement: new DynamicContent({}, {}, extension && extension.client),
    };

    const GCCInstance = new GCCRestApi({
      apiKey: params.apiKey || '',
    });

    const users = await extension.users.list();

    const projects: Project[] = await GCCInstance.getProjects();

    // Only use projects that have been configured, in the same order.
    const finalProjects: Project[] = [];
    params.projects.forEach((project) => {
      const matchingProject = projects.find(
        (config) => config.connector_key === project.id
      );
      if (matchingProject && finalProjects.length < MAX_PROJECTS) {
        finalProjects.push(matchingProject);
      }
    });

    dispatch(setApi(GCCInstance));

    dispatch(setSDK(sdkInited));
    dispatch(setUsers(users));

    dispatch({
      type: SET_PROJECTS,
      value: finalProjects,
    });

    if (finalProjects && finalProjects.length) {
      dispatch(setProject(finalProjects[0].connector_key));
      const config = await GCCInstance.getProjectConfig(
        finalProjects[0].connector_key
      );
      dispatch(setProjectConfig(config));
    }

    return sdkInited;
  } catch (e: any) {
    return dispatch(setError(e.toString()));
  }
};
