export const SET_CONTENT = 'SET_CONTENT';
export const SET_TABLE = 'SET_TABLE';
export const SET_CREATE = 'SET_CREATE';
export const SET_LOADING_BY_ID = 'SET_LOADING_BY_ID';

export const setContentLoader = (value: boolean) => ({
  type: SET_CONTENT,
  value,
});

export const setTableLoader = (value: boolean) => ({
  type: SET_TABLE,
  value,
});

export const setLoaderById = (id: number, value: boolean) => ({
  type: SET_LOADING_BY_ID,
  value,
  id,
});

export const setCreateLoader = (value: boolean) => ({
  type: SET_CREATE,
  value,
});
