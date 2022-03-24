import React, { useEffect } from 'react';
import { MenuItem, Menu, Icon, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import PopupState, {
  bindTrigger,
  bindMenu,
  InjectedProps,
} from 'material-ui-popup-state';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
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
  const dispatch = useDispatch();
  const classes = useStyles();
  const { data, pagination }: TasksInterface = useSelector(
    (state: RootState) => state.tasks
  );
  const { content, loadingIds }: LoadingsInterface = useSelector(
    (state: RootState) => state.loadings
  );

  const { SDK }: SDKInterface = useSelector((state: RootState) => state.sdk);

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
                <Menu {...bindMenu(popupState)}>
                  {row.status === 'Completed' ? (
                    <MenuItem
                      onClick={() => {
                        dispatch(downloadTask(row));
                        popupState.close();
                      }}
                    >
                      Apply Translation
                    </MenuItem>
                  ) : null}
                  {row.metadata && row.metadata.localizedId ? (
                    <MenuItem
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
                      View Translated
                    </MenuItem>
                  ) : null}
                  <MenuItem
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
                    View Source
                  </MenuItem>
                  {row.status !== 'Delivered' &&
                  row.status !== 'Cancelled' &&
                  row.state.state_name !== 'Cancelled' &&
                  row.status !== 'Completed' ? (
                    <MenuItem
                      onClick={() => {
                        dispatch(cancelTask(row));
                        popupState.close();
                      }}
                    >
                      Cancel
                    </MenuItem>
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
      <Table columns={columns} data={data} currentPage={pagination.page} />
    </>
  );
};

export default Tasks;
