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

    let projects: Project[] = await GCCInstance.getProjects();

    // Only count projects that have been configured.
    projects = projects.filter(
      (project: Project) =>
        params.projects &&
        params.projects.findIndex(
          (config) => config.id === project.connector_key
        ) !== -1
    );

    dispatch(setApi(GCCInstance));

    dispatch(setSDK(sdkInited));
    dispatch(setUsers(users));

    dispatch({
      type: SET_PROJECTS,
      value: projects,
    });

    if (projects && projects.length) {
      dispatch(setProject(projects[0].connector_key));
      const config = await GCCInstance.getProjectConfig(
        projects[0].connector_key
      );
      dispatch(setProjectConfig(config));
    }

    return sdkInited;
  } catch (e: any) {
    return dispatch(setError(e.toString()));
  }
};
