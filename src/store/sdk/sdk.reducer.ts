import { AnyAction } from 'redux';
import { DynamicContent } from 'dc-management-sdk-js';
import { SET_SDK } from './sdk.actions';
import { SDKInterface } from '../../types/types';

export const defaultSdk = {
  connected: false,
  dcManagement: new DynamicContent({}, {}),
  params: {
    apiKey: '',
    apiUrl: '',
    dueDate: 7,
    fileType: 'json',
    hubId: '',
    maxContentInSubmission: 50,
    projects: [],
    statuses: { ready: '', inProgress: '', translated: '' },
    templates: [],
    vse: '',
  },
};

export function sdkReducer(
  state = defaultSdk,
  action: AnyAction
): SDKInterface {
  switch (action.type) {
    case SET_SDK:
      return { ...state, ...(action.value as SDKInterface) };
    default:
      return state;
  }
}
