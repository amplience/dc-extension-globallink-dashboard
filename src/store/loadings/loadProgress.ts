import { AppDispatch } from '../store';
import { setDialogLoader } from './loadings.actions';

export enum SubmissionStage {}

export enum ImportStage {}

export interface LoadProgress {
  title: string;
  startTime: number;

  stageNumber: number;
  stageName: string;
  stageStartTime: number;
  stageTotal: number;

  totalProgress: number;
  currentProgress: {
    num: number;
    text: string;
  };

  error?: string;
  errorTime?: number;
}

export function createProgress(
  title: string,
  stageTotal: number
): LoadProgress {
  return {
    title,
    startTime: Date.now(),

    stageNumber: 0,
    stageName: '',
    stageStartTime: 0,
    stageTotal,

    totalProgress: 0,
    currentProgress: {
      num: 0,
      text: '',
    },
  };
}

export function setProgressTitle(
  progress: LoadProgress,
  title: string,
  stageTotal: number,
  dispatch: AppDispatch
) {
  progress.title = title;
  progress.stageTotal = stageTotal;

  dispatch(setDialogLoader({ ...progress }));
}

export function setProgressStage(
  progress: LoadProgress,
  stageNumber: number,
  stageName: string,
  totalProgress: number,
  dispatch: AppDispatch
) {
  progress.stageNumber = stageNumber;
  progress.stageName = stageName;
  progress.totalProgress = totalProgress;

  dispatch(setDialogLoader({ ...progress }));
}

export function setProgress(
  progress: LoadProgress,
  num: number,
  text: string,
  dispatch: AppDispatch
) {
  progress.currentProgress = {
    num,
    text,
  };

  dispatch(setDialogLoader({ ...progress }));
}

export function setProgressText(
  progress: LoadProgress,
  text: string,
  dispatch: AppDispatch
) {
  progress.currentProgress.text = text;

  dispatch(setDialogLoader({ ...progress }));
}

export function setProgressError(
  progress: LoadProgress,
  error: any,
  dispatch: AppDispatch
) {
  progress.error = error.toString();
  progress.errorTime = Date.now();

  if (error.response && error.response.data) {
    const { data } = error.response;
    if (data.message) {
      progress.error = `Status ${data.status ?? error.response.status}: ${
        data.message
      }`;
    } else if (data.errors && data.errors.length) {
      const error = data.errors[0];
      progress.error = `${error.code} (${error.entity}): ${error.message} ${
        error.invalidValue ? `(${error.invalidValue})` : ''
      }`;
    }
  }

  return dispatch(setDialogLoader({ ...progress }));
}
