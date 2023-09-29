import { AppDispatch } from '../store';
import { setCreateLoader } from './loadings.actions';

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

  dispatch(setCreateLoader({ ...progress }));
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

  dispatch(setCreateLoader({ ...progress }));
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

  dispatch(setCreateLoader({ ...progress }));
}

export function setProgressText(
  progress: LoadProgress,
  text: string,
  dispatch: AppDispatch
) {
  progress.currentProgress.text = text;

  dispatch(setCreateLoader({ ...progress }));
}

export function setProgressError(
  progress: LoadProgress,
  error: string,
  dispatch: AppDispatch
) {
  progress.error = error;

  return dispatch(setCreateLoader({ ...progress }));
}
