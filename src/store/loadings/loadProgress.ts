import { AppDispatch } from '../store';
import { LoadModal } from './loadModal';
import { setDialogLoader } from './loadings.actions';

export enum SubmissionStage {}

export enum ImportStage {}

export interface LoadList {
  title?: string;
  startTime: number;
  progress: (LoadProgress | null)[];
}

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

  modal?: LoadModal;
  retryNumber?: number;
}

export interface ProgressContext {
  array: LoadList;
  index: number;
  elem: LoadProgress;
  dispatch: AppDispatch;
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

export function createProgressList(
  total: number,
  maxParallelism: number,
  title = undefined as string | undefined,
  startTime = 0
): LoadList {
  const length = Math.min(total, maxParallelism);
  const progress = Array.from({ length }).map(() => null);

  return {
    progress,
    startTime: startTime === 0 ? Date.now() : startTime,
    title,
  };
}

export function parallelProcess<T>(
  data: T[],
  maxParallelism: number,
  action: (data: T, index: number) => Promise<any>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const parallelism = Math.min(data.length, maxParallelism);
    const remainingData = [...data];

    let i = 0;
    let ended = false;
    let errored = false;
    const toComplete = new Set<number>(data.map((_, index) => index));

    const onError = (e: any, index: number) => {
      // Stop other tasks from being dispatched.
      toComplete.delete(index);
      if (!errored) {
        errored = true;
        reject(e);
      }
    };

    const nextTask = (index: number = -1) => {
      toComplete.delete(index);
      if (!errored) {
        if (remainingData.length > 0) {
          const elem = remainingData[0];
          remainingData.splice(0, 1);
          const newIndex = i++;

          const task = action(elem, newIndex);

          task
            .catch((e) => onError(e, newIndex))
            .then(() => nextTask(newIndex));
        } else if (!ended && toComplete.size === 0) {
          ended = true;
          resolve();
        }
      }
    };

    if (parallelism === 0) {
      resolve();
    }

    // Dispatch the initial set of tasks.
    for (let i = 0; i < parallelism; i++) {
      nextTask();
    }
  });
}

export function createProgressContext(
  progressList: LoadList,
  title: string,
  stageTotal: number,
  dispatch
): ProgressContext {
  // Identify a null slot to put the context into.
  for (let i = 0; i < progressList.progress.length; i++) {
    if (progressList.progress[i] == null) {
      const progress = createProgress(title, stageTotal);
      progressList.progress[i] = progress;

      dispatch(setDialogLoader({ ...progressList }));

      return {
        array: progressList,
        index: i,
        elem: progress,
        dispatch,
      };
    }
  }

  throw new Error('Progress context overflow');
}

export function freeProgressContext(context: ProgressContext) {
  context.array.progress[context.index] = null;

  context.dispatch(setDialogLoader({ ...context.array }));
}

export function setProgressTitle(
  progress: ProgressContext,
  title: string,
  stageTotal: number
) {
  progress.elem.title = title;
  progress.elem.stageTotal = stageTotal;

  progress.dispatch(setDialogLoader({ ...progress.array }));
}

export function setProgressStage(
  progress: ProgressContext,
  stageNumber: number,
  stageName: string,
  totalProgress: number
) {
  progress.elem.stageNumber = stageNumber;
  progress.elem.stageName = stageName;
  progress.elem.totalProgress = totalProgress;

  progress.dispatch(setDialogLoader({ ...progress.array }));
}

export function setProgress(
  progress: ProgressContext,
  num: number,
  text: string
) {
  progress.elem.currentProgress = {
    num,
    text,
  };

  progress.dispatch(setDialogLoader({ ...progress.array }));
}

export function setProgressText(progress: ProgressContext, text: string) {
  progress.elem.currentProgress.text = text;

  progress.dispatch(setDialogLoader({ ...progress.array }));
}

export function setProgressError(progress: ProgressContext, error: any) {
  progress.elem.error = error.toString();
  progress.elem.errorTime = Date.now();

  if (error.response && error.response.data) {
    const { data } = error.response;
    if (data.message) {
      progress.elem.error = `Status ${data.status ?? error.response.status}: ${
        data.message
      }`;
    } else if (data.errors && data.errors.length) {
      const error = data.errors[0];
      progress.elem.error = `${error.code} (${error.entity}): ${error.message}
      ${error.invalidValue ? `(${error.invalidValue})` : ''}`;
    }
  }

  return progress.dispatch(setDialogLoader({ ...progress.array }));
}

export function setProgressModal(
  progress: ProgressContext,
  modal: LoadModal | undefined
) {
  progress.elem.modal = modal;

  progress.dispatch(setDialogLoader({ ...progress.array }));
}

export function setProgressRetry(
  progress: ProgressContext,
  retry: number | undefined
) {
  progress.elem.retryNumber = retry;

  progress.dispatch(setDialogLoader({ ...progress.array }));
}
