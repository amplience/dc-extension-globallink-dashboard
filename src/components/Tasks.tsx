import React, { useEffect, useState } from 'react';
import {
  MenuItem,
  Menu,
  Icon,
  makeStyles,
  Modal,
  Typography,
  Paper,
  Box,
  Divider,
  ListItemIcon,
  CircularProgress,
  Button,
  IconButton,
} from '@material-ui/core';
import ReactCountryFlag from 'react-country-flag';
import { useDispatch, useSelector } from 'react-redux';
import PopupState, {
  bindTrigger,
  bindMenu,
  InjectedProps,
} from 'material-ui-popup-state';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import CancelIcon from '@material-ui/icons/Cancel';
import InputIcon from '@material-ui/icons/Input';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import CodeIcon from '@material-ui/icons/Code';
import CloseIcon from '@material-ui/icons/Close';
import { RootState } from '../store/store';
import Table from './common/Table';
import Loader from './common/Loader';
import {
  getTasks,
  downloadTask,
  cancelTask,
} from '../store/tasks/tasks.actions';
import {
  TasksInterface,
  LoadingsInterface,
  SDKInterface,
  TaskInterface,
} from '../types/types';
import LoadingModal from './LoadingModal';
import ConfirmationDialog from './ConfirmationDialog';

const getCountryCode = (code: string) => code.split('-')[1] || '';

export const useStyles = makeStyles(() => ({
  status: {
    marginRight: '15px',
    verticalAlign: 'middle',
  },
  icon: {
    verticalAlign: 'middle',
    cursor: 'pointer',
    color: '#f44336',
  },
  menuIcon: {
    display: 'flex',
    alignItems: 'flex-end',
    cursor: 'pointer',
  },
}));

const TASK_STATUSES: { [key: string]: string } = {
  Translate: 'Translating',
  Completed: 'Completed',
  Delivered: 'Translation Complete',
};

const Tasks = () => {
  const [openModal, setOpenModal] = React.useState(false);
  const [contentModal, setContentModal] = React.useState<TaskInterface>();
  const dispatch = useDispatch();
  const classes = useStyles();
  const { data, pagination }: TasksInterface = useSelector(
    (state: RootState) => state.tasks
  );
  const { content, loadingIds, dialog }: LoadingsInterface = useSelector(
    (state: RootState) => state.loadings
  );

  const { SDK }: SDKInterface = useSelector((state: RootState) => state.sdk);

  const [applyRow, setApplyRow] = useState<TaskInterface | undefined>();
  const [applyDialogShow, setApplyDialogShow] = useState(false);

  const handleClose = () => {
    setOpenModal(false);
  };

  const columns = [
    {
      id: 'name',
      label: 'Name',
    },
    {
      id: 'source_locale',
      label: 'Source language',
      format: (sourceLocale: {
        locale_display_name: string;
        locale: string;
      }) => (
        <>
          <ReactCountryFlag
            countryCode={getCountryCode(sourceLocale.locale)}
            style={{ marginRight: 4 }}
          />
          {sourceLocale.locale_display_name} ({sourceLocale.locale})
        </>
      ),
    },
    {
      id: 'target_locale',
      label: 'Target language',
      format: (targetLocale: {
        locale_display_name: string;
        locale: string;
      }) => (
        <>
          <ReactCountryFlag
            countryCode={getCountryCode(targetLocale.locale)}
            style={{ marginRight: 4 }}
          />
          {targetLocale.locale_display_name} ({targetLocale.locale})
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
      id: '_status',
      label: 'Status',
      format: (row: TaskInterface) => (
        <div
          title={row.error_message}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {row.status === 'Translate' || row.status === 'Processing' ? (
            <CircularProgress size="1rem" style={{ marginRight: 5 }} />
          ) : null}
          {row.status === 'Completed' ? (
            <ThumbUpIcon color="primary" style={{ marginRight: 5 }} />
          ) : null}
          {row.status === 'Cancelled' ? (
            <HighlightOffIcon color="action" style={{ marginRight: 5 }} />
          ) : null}
          {row.status === 'Delivered' ? (
            <CheckCircleIcon htmlColor="#33aa33" style={{ marginRight: 5 }} />
          ) : null}
          <span className={classes.status}>
            {TASK_STATUSES[row.status] || row.status}
          </span>
          {row.is_error ? (
            <ErrorOutline className={classes.icon} style={{ marginLeft: 5 }} />
          ) : null}
        </div>
      ),
    },
    {
      id: 'menu',
      label: ' ',
      format: (row: TaskInterface) =>
        loadingIds[row.task_id] ? (
          <Loader className="tableLoader" />
        ) : (
          <PopupState variant="popover" popupId="demo-popup-menu">
            {(popupState: InjectedProps) => (
              <>
                <Icon
                  component="a"
                  className={classes.menuIcon}
                  {...bindTrigger(popupState)}
                >
                  <MoreHorizIcon fontSize="small" />
                </Icon>
                <Menu {...bindMenu(popupState)} style={{ width: '400px' }}>
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
                  <MenuItem
                    style={{ width: '280px' }}
                    onClick={() => {
                      // @ts-ignore
                      if (SDK && SDK.applicationNavigator && SDK.options) {
                        const href = SDK.applicationNavigator.openContentItem(
                          { id: row.unique_identifier },
                          { returnHref: true }
                        );
                        // @ts-ignore
                        SDK.options.window.open(href, '_blank');
                      }
                      popupState.close();
                    }}
                  >
                    <ListItemIcon>
                      <InputIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography>View Source</Typography>
                  </MenuItem>
                  {row.metadata && row.metadata.localizedId ? (
                    <MenuItem
                      style={{ width: '280px' }}
                      onClick={() => {
                        // @ts-ignore
                        if (SDK && SDK.applicationNavigator && SDK.options) {
                          const href = SDK.applicationNavigator.openContentItem(
                            { id: row.metadata.localizedId },
                            { returnHref: true }
                          );
                          // @ts-ignore
                          SDK.options.window.open(href, '_blank');
                        }
                        popupState.close();
                      }}
                    >
                      <ListItemIcon>
                        <AssignmentTurnedInIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography>View Translated</Typography>
                    </MenuItem>
                  ) : null}
                  {row.status === 'Completed' ? (
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
                        <Typography>Apply Translation</Typography>
                      </MenuItem>
                    </>
                  ) : null}
                  {row.status !== 'Delivered' &&
                  row.status !== 'Cancelled' &&
                  row.state.state_name !== 'Cancelled' &&
                  row.status !== 'Completed' ? (
                    <>
                      <Divider style={{ margin: 5 }} />
                      <MenuItem
                        style={{ width: '280px' }}
                        onClick={() => {
                          dispatch(cancelTask(row));
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
      dispatch(getTasks());
    }
  }, [pagination, dispatch]);

  const applyTask = (apply: boolean) => {
    if (apply && applyRow) {
      dispatch(downloadTask(applyRow));
    }

    setApplyDialogShow(false);
  };

  return (
    <>
      <ConfirmationDialog
        open={applyDialogShow}
        title="Confirm Translation"
        description={`This will apply translation task:\n- "${applyRow?.name}" to ${applyRow?.target_locale?.locale_display_name}`}
        onResult={applyTask}
      />
      {content ? <Loader className="content-loader" /> : null}
      <LoadingModal loadProgress={dialog} />
      <Table
        columns={columns}
        data={data}
        currentPage={pagination.page}
        pageSize={10}
        rowClick={(row: any) => {
          setContentModal(row);
          setOpenModal(true);
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
            {contentModal?.name}
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

export default Tasks;
