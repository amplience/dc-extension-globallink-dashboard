import React, { useEffect } from 'react';
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
} from '@material-ui/core';
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
import AssignmentIcon from '@material-ui/icons/Assignment';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
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
  const { content, loadingIds, create }: LoadingsInterface = useSelector(
    (state: RootState) => state.loadings
  );

  const { SDK }: SDKInterface = useSelector((state: RootState) => state.sdk);

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
      label: 'Source Language',
      format: (sourceLocale: { locale_display_name: string; locale: string }) =>
        `${sourceLocale.locale_display_name} (${sourceLocale.locale})`,
    },
    {
      id: 'target_locale',
      label: 'Target Language',
      format: (targetLocale: { locale_display_name: string; locale: string }) =>
        `${targetLocale.locale_display_name} (${targetLocale.locale})`,
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
        <div title={row.error_message}>
          <span className={classes.status}>
            {TASK_STATUSES[row.status] || row.status}
          </span>
          {row.is_error ? <ErrorOutline className={classes.icon} /> : null}
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
                  ...
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
                      <AssignmentIcon fontSize="small" />
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
                      <Divider />
                      <MenuItem
                        style={{ width: '280px' }}
                        onClick={() => {
                          dispatch(downloadTask(row));
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
                      <Divider />
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

  return (
    <>
      {content ? <Loader className="content-loader" /> : null}
      <LoadingModal loadProgress={create} />
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
            height: '500px',
            padding: 20,
          }}
        >
          <Box style={{ maxHeight: '500px', overflow: 'scroll' }}>
            <Typography variant="body1" component="pre">
              {JSON.stringify(contentModal, null, 4)}
            </Typography>
          </Box>
        </Paper>
      </Modal>
    </>
  );
};

export default Tasks;
