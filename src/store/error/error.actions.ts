export const SET_ERROR = 'SET_ERROR';

export const setError = (value: string) => ({
  type: SET_ERROR,
  value,
});
