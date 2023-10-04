import {
  Dialog,
  LinearProgress,
  DialogTitle,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@material-ui/core';
import { useEffect, useReducer, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LoadProgress } from '../store/loadings/loadProgress';
import { setDialogLoader } from '../store/loadings/loadings.actions';

const timeSpanString = (span: number): string => {
  const seconds = Math.floor((span / 1000) % 60);
  const minutes = Math.floor((span / (1000 * 60)) % 60);
  const hours = Math.floor(span / (1000 * 60 * 60));

  const padMins = String(minutes).padStart(2, '0');
  const padSecs = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${padMins}:${padSecs}`;
  }

  return `${minutes}:${padSecs}`;
};

const defaultLoadProgress = {
  title: '',
  startTime: Date.now(),

  stageNumber: 0,
  stageName: '',
  stageTotal: 1,
  stageStartTime: Date.now(),

  totalProgress: 1,
  currentProgress: {
    num: 0,
    text: '',
  },
  error: undefined,
  errorTime: 0,
} as LoadProgress;

const LoadingModal = ({
  loadProgress,
}: {
  loadProgress: LoadProgress | undefined;
}) => {
  const dispatch = useDispatch();
  const visible = loadProgress != null;
  const [drawNum, redraw] = useReducer((x) => x + 1, 0);
  const [lastError, setLastError] = useState(defaultLoadProgress);

  useEffect(() => {
    let active = true;

    if (visible) {
      setTimeout(() => {
        if (active) {
          redraw();
        }
      }, 1000);
    }

    return () => {
      active = false;
    };
  }, [drawNum, visible]);

  const closeError = () => {
    setLastError(loadProgress ?? lastError);
    dispatch(setDialogLoader(undefined));
  };

  const progress = loadProgress ?? lastError;

  const progressFrac = progress.currentProgress.num / progress.totalProgress;
  const totalProgressPct =
    ((progress.stageNumber + progressFrac) / progress.stageTotal) * 100;

  const now = progress.error ? progress.errorTime ?? 0 : Date.now();
  const sinceStart = timeSpanString(now - progress.startTime);
  // const sinceStageStart = timeSpanString(now - progress.stageStartTime);

  return (
    <Dialog open={visible}>
      <DialogTitle id="alert-dialog-title">
        {progress.title} ({sinceStart})
      </DialogTitle>
      <DialogContent style={{ minWidth: '400px' }}>
        <DialogContentText id="alert-dialog-description">
          {progress.stageName} ({progress.stageNumber + 1} /{' '}
          {progress.stageTotal})
        </DialogContentText>
        <LinearProgress
          variant="determinate"
          value={totalProgressPct}
          style={{ marginBottom: '12px' }}
          color={progress.error ? 'secondary' : 'primary'}
        />
        <DialogContentText id="alert-dialog-progress">
          {progress.currentProgress.text}
        </DialogContentText>
        {progress.error && (
          <DialogContentText
            id="alert-dialog-error"
            style={{ color: 'darkred', fontStyle: 'italic' }}
          >
            {progress.error}
          </DialogContentText>
        )}
      </DialogContent>
      {progress.error && (
        <DialogActions>
          <Button autoFocus onClick={closeError}>
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default LoadingModal;
