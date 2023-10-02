import React, { useEffect } from 'react';
import {
  MenuItem,
  Menu,
  Icon,
  Paper,
  Divider,
  Typography,
  ListItemIcon,
} from '@material-ui/core';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import CancelIcon from '@material-ui/icons/Cancel';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { useDispatch, useSelector } from 'react-redux';
import PopupState, {
  bindTrigger,
  bindMenu,
  InjectedProps,
} from 'material-ui-popup-state';
import { withRouter } from 'react-router';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import {
  LoadingsInterface,
  RootStateInt,
  SubmissionInt,
  SubmissionsInterface,
  UserInterface,
} from '../types/types';
import Table from './common/Table';
import Loader from './common/Loader';
import {
  getSubmissions,
  setSelectedSubmission,
  cancelSubmission,
} from '../store/submissions/submissions.actions';
import { applyAllTranslations } from '../store/tasks/tasks.actions';
import SubmissionFilterBar from './SubmissionFilterBar';
import { useStyles } from './Tasks';
import LoadingModal from './LoadingModal';

export const SUBMISSION_STATUSES: { [key: string]: string } = {
  Delivered: 'Translation Complete',
  Completed: 'Translation Ready',
  Translate: 'Translating',
};

const Submissions = (props) => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const { history } = props;
  const { data, pagination, filter }: SubmissionsInterface = useSelector(
    (state: RootStateInt) => state.submissions
  );
  const { content, loadingIds, dialog }: LoadingsInterface = useSelector(
    (state: RootStateInt) => state.loadings
  );
  const { data: users }: { data: UserInterface[] } = useSelector(
    (state: RootStateInt) => state.users
  );

  const columns = [
    {
      id: 'submission_name',
      label: 'Submission name',
    },
    {
      id: 'submitter',
      label: 'Submitter',
    },
    {
      id: 'source_locale',
      label: 'Source language',
      format: (sourceLocale: { locale_display_name: string; locale: string }) =>
        `${sourceLocale.locale_display_name} (${sourceLocale.locale})`,
    },
    {
      id: 'language_jobs',
      label: 'Target language',
      format: (
        languageJobs: {
          target_locale: { locale_display_name: string; locale: string };
        }[]
      ) =>
        languageJobs
          .map(
            (job) =>
              `${job.target_locale.locale_display_name} (${job.target_locale.locale})`
          )
          .join(', '),
    },
    {
      id: 'due_date',
      label: 'Due Date',
      format: (timestamp: number) =>
        new Date(timestamp).toLocaleDateString().replaceAll('.', '/'),
    },
    {
      id: '_state',
      label: 'Status',
      format: (row: SubmissionInt) => (
        <div>
          <span className={classes.status}>
            {row.state
              ? SUBMISSION_STATUSES[row.state.state_name] ||
                row.state.state_name
              : ''}
          </span>
          {row.is_error ? <ErrorOutline className={classes.icon} /> : null}
        </div>
      ),
    },
    {
      id: 'menu',
      label: ' ',
      format: (row: SubmissionInt) =>
        loadingIds[row.submission_id || ''] ? (
          <Loader className="tableLoader" />
        ) : (
          <PopupState variant="popover" popupId="demo-popup-menu">
            {(popupState: InjectedProps) => (
              <>
                <Icon
                  component="a"
                  className="menu-icon"
                  {...bindTrigger(popupState)}
                >
                  ...
                </Icon>
                <Menu {...bindMenu(popupState)}>
                  <MenuItem
                    style={{ width: '280px' }}
                    onClick={() => {
                      dispatch(setSelectedSubmission(row));
                      popupState.close();
                    }}
                  >
                    <ListItemIcon>
                      <AssignmentIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography>View Tasks</Typography>
                  </MenuItem>
                  {row && row.state && row.state.state_name === 'Completed' ? (
                    <>
                      <Divider />
                      <MenuItem
                        style={{ width: '280px' }}
                        onClick={() => {
                          dispatch(applyAllTranslations(row));
                          popupState.close();
                        }}
                      >
                        <ListItemIcon>
                          <SaveAltIcon fontSize="small" />
                        </ListItemIcon>
                        <Typography>Apply all translations</Typography>
                      </MenuItem>
                    </>
                  ) : null}
                  {row &&
                  row.state &&
                  row.state.state_name !== 'Delivered' &&
                  row.state.state_name !== 'Cancelled' &&
                  row.state.state_name !== 'Completed' ? (
                    <>
                      <Divider />
                      <MenuItem
                        style={{ width: '280px' }}
                        onClick={() => {
                          dispatch(cancelSubmission(row));
                          popupState.close();
                        }}
                      >
                        <ListItemIcon>
                          <CancelIcon fontSize="small" />
                        </ListItemIcon>
                        <Typography>Cancel</Typography>
                      </MenuItem>
                    </>
                  ) : null}
                </Menu>
              </>
            )}
          </PopupState>
        ),
    },
  ];

  useEffect(() => {
    if (pagination && !pagination.page) {
      dispatch(getSubmissions(1, filter));
    }
  }, [pagination, dispatch, filter]);

  return (
    <>
      {content ? <Loader className="content-loader" /> : null}
      <LoadingModal loadProgress={dialog} />
      <Paper
        elevation={1}
        variant="outlined"
        square
        style={{
          padding: '0 20px',
        }}
      >
        <SubmissionFilterBar
          filterOptions={{
            state: [
              {
                label: 'Translation Complete',
                value: 'Delivered',
              },
              {
                label: 'Translation Ready',
                value: 'Completed',
              },
              {
                label: 'Translating',
                value: 'Translate',
              },
              {
                label: 'Pre-process',
                value: 'Pre-process',
              },
              {
                label: 'Cancelled',
                value: 'Cancelled',
              },
            ],
            submitters: users
              .filter((assignee) => assignee != null)
              .map(({ firstName, lastName }: any) => ({
                label: `${firstName} ${lastName}`,
                value: `${firstName} ${lastName}`,
              })),
          }}
          filter={filter}
        />
      </Paper>

      <Table
        columns={columns}
        data={data}
        currentPage={pagination.page}
        pageSize={10}
        rowClick={(row: any) => {
          dispatch(setSelectedSubmission(row));
          history.push('/tasks');
        }}
      />
    </>
  );
};

export default withRouter(Submissions);
