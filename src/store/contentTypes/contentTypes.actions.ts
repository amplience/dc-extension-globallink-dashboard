import { ContentType } from 'dc-management-sdk-js';

export const SET_CONTENT_TYPES = 'SET_CONTENT_TYPES';

export const setContentTypes = (value: ContentType[]) => ({
  type: SET_CONTENT_TYPES,
  value,
});
