import React, { useEffect, useState } from 'react';
import {
  MenuItem,
  Menu,
  Icon,
  Paper,
  Divider,
  Typography,
  ListItemIcon,
  CircularProgress,
  Modal,
  Box,
  IconButton,
  Button,
} from '@material-ui/core';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import CancelIcon from '@material-ui/icons/Cancel';
import AssignmentIcon from '@material-ui/icons/Assignment';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import CodeIcon from '@material-ui/icons/Code';
import CloseIcon from '@material-ui/icons/Close';
import { useDispatch, useSelector } from 'react-redux';
import PopupState, {
  bindTrigger,
  bindMenu,
  InjectedProps,
} from 'material-ui-popup-state';
import { withRouter } from 'react-router';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import ReactCountryFlag from 'react-country-flag';
import {
  LoadingsInterface,
  ProjectStateInterface,
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
import ConfirmationDialog from './ConfirmationDialog';

export const SUBMISSION_STATUSES: { [key: string]: string } = {
  Delivered: 'Translation Complete',
  Completed: 'Translation Ready',
  Translate: 'Translating',
};

export const POLLING_TIME = 15000;

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
  const { selectedProject }: ProjectStateInterface = useSelector(
    (state: RootStateInt) => state.projects
  );

  const [applyRow, setApplyRow] = useState<SubmissionInt | undefined>();
  const [applyDialogShow, setApplyDialogShow] = useState(false);
  const [openModal, setOpenModal] = React.useState(false);
  const [contentModal, setContentModal] = React.useState<SubmissionInt>();

  const handleClose = () => {
    setOpenModal(false);
  };

  const getCountryCode = (code: string) => code.split('-')[1] || '';

  const columns = [
    {
      id: 'submission_name',
      label: 'Submission name',
      format: (submission_name: string) => (
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '300px',
          }}
          title={submission_name}
        >
          <Typography noWrap variant="body2">
            {submission_name}
          </Typography>
        </div>
      ),
    },
    {
      id: 'submitter',
      label: 'Submitter',
    },
    {
      id: 'source_locale',
      label: 'Source language',
      format: (sourceLocale: {
        locale_display_name: string;
        locale: string;
      }) => (
        <>
          <span title={sourceLocale.locale_display_name}>
            <ReactCountryFlag
              countryCode={getCountryCode(sourceLocale.locale)}
              style={{ marginRight: 4 }}
            />
            {sourceLocale.locale}
          </span>
        </>
      ),
    },
    {
      id: 'language_jobs',
      label: 'Target language',
      format: (
        languageJobs: {
          target_locale: { locale_display_name: string; locale: string };
        }[]
      ) => (
        <>
          {languageJobs
            .sort((a, b) => {
              if (a.target_locale.locale > b.target_locale.locale) return -1;
              return 1;
            })
            .map((job, index) => (
              <span
                key={index}
                title={job.target_locale.locale_display_name}
                style={{ marginRight: 8 }}
              >
                <ReactCountryFlag
                  key={job.target_locale.locale}
                  countryCode={getCountryCode(job.target_locale.locale)}
                  style={{ marginRight: 4 }}
                />
                {job.target_locale.locale}
              </span>
            ))}
        </>
      ),
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
          <span
            className={classes.status}
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {row.state &&
            (row.state.state_name === 'Pre-process' ||
              row.state.state_name === 'Translate' ||
              row.state.state_name === 'Analyzed' ||
              row.state.state_name === 'Started') ? (
              <CircularProgress size="1rem" style={{ marginRight: 5 }} />
            ) : null}
            {row.state && row.state.state_name === 'Completed' ? (
              <ThumbUpIcon color="primary" style={{ marginRight: 5 }} />
            ) : null}
            {row.state && row.state.state_name === 'Cancelled' ? (
              <HighlightOffIcon color="action" style={{ marginRight: 5 }} />
            ) : null}
            {row.state && row.state.state_name === 'Delivered' ? (
              <>
                <CheckCircleIcon
                  htmlColor="#33aa33"
                  style={{ marginRight: 5 }}
                />
              </>
            ) : null}
            {row.state
              ? SUBMISSION_STATUSES[row.state.state_name] ||
                row.state.state_name
              : ''}
            {row.is_error ? (
              <ErrorOutline
                className={classes.icon}
                style={{ marginLeft: 5 }}
              />
            ) : null}
          </span>
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
                  <MoreHorizIcon fontSize="small" />
                </Icon>
                <Menu {...bindMenu(popupState)}>
                  <MenuItem
                    style={{ width: '280px' }}
                    onClick={() => {
                      setContentModal(row);
                      setOpenModal(true);
                      popupState.close();
                    }}
                  >
                    <ListItemIcon>
                      <CodeIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography>View Details</Typography>
                  </MenuItem>
                  {row &&
                  row.state &&
                  row.language_jobs.filter(
                    (job: any) => job.state.state_name !== 'Pre-process'
                  ).length &&
                  row.state.state_name !== 'Pre-process' ? (
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
                  ) : null}
                  {row && row.state && row.state.state_name === 'Completed' ? (
                    <>
                      <Divider style={{ margin: 5 }} />
                      <MenuItem
                        style={{ width: '280px' }}
                        onClick={() => {
                          setApplyRow(row);
                          setApplyDialogShow(true);
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
                  row.state.state_name !== 'Pre-process' &&
                  row.state.state_name !== 'Cancelled' &&
                  row.state.state_name !== 'Completed' ? (
                    <>
                      <Divider style={{ margin: 5 }} />
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
    if (selectedProject) {
      if (pagination && !pagination.page) {
        dispatch(getSubmissions(1, filter));
      }
      if (POLLING_TIME) {
        const interval = setInterval(() => {
          if (pagination && !pagination.page) {
            dispatch(getSubmissions(1, filter));
          } else if (pagination && pagination.page) {
            dispatch(getSubmissions(pagination.page, filter));
          }
        }, POLLING_TIME);
        return () => clearInterval(interval);
      }
    }
    return () => {};
  }, [pagination, dispatch, filter, selectedProject]);

  const applyTask = (apply: boolean) => {
    if (apply && applyRow) {
      dispatch(applyAllTranslations(applyRow));
    }

    setApplyDialogShow(false);
  };

  return (
    <>
      <ConfirmationDialog
        open={applyDialogShow}
        title="Confirm Translation"
        description={`This will apply all translation tasks for "${applyRow?.submission_name}".`}
        onResult={applyTask}
      />
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
          if (
            row.state.state_name !== 'Pre-process' &&
            row.language_jobs.filter(
              (job: any) => job.state.state_name !== 'Pre-process'
            ).length
          ) {
            dispatch(setSelectedSubmission(row));
            history.push('/tasks');
          }
        }}
      />
      <Modal
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        open={openModal}
        onClose={handleClose}
      >
        <Paper
          style={{
            width: '800px',
            height: '520px',
            padding: 20,
          }}
        >
          <Box style={{ display: 'flex', justifyContent: 'right' }}>
            <IconButton size="small" onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="h5" style={{ marginBottom: 16 }}>
            {contentModal?.submission_name}
          </Typography>
          <Box
            style={{
              maxHeight: '400px',
              overflow: 'scroll',
              marginBottom: 16,
            }}
          >
            <pre style={{ fontSize: '0.8rem' }}>
              {JSON.stringify(contentModal, null, 4)}
            </pre>
          </Box>
          <Box style={{ display: 'flex', justifyContent: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenModal(false)}
            >
              Close
            </Button>
          </Box>
        </Paper>
      </Modal>
    </>
  );
};

export default withRouter(Submissions);
