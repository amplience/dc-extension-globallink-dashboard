import React from 'react';
import {
  AppBar,
  Toolbar,
  Select,
  FormControl,
  makeStyles,
  MenuItem,
  Typography,
  Breadcrumbs,
  Link,
  LinkProps,
  Button,
  IconButton,
} from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';

import { useSelector, useDispatch } from 'react-redux';
import { Route } from 'react-router';
import { Link as RouterLink } from 'react-router-dom';
import { RootState } from '../store/store';
import { setProject } from '../store/project/project.actions';
import { getSubmissions } from '../store/submissions/submissions.actions';
import { getTasks } from '../store/tasks/tasks.actions';
import { ProjectStateInterface } from '../types/types';
import TablePagination from './common/TablePagination';

interface LinkRouterProps extends LinkProps {
  to: string;
}

const useStyles = makeStyles(() => ({
  navbar: {
    backgroundColor: '#ffffff',
  },
  navBarContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
  },
  formControl: {
    width: '400px',
  },
  filledInput: {
    padding: '15px 12px !important',
  },
  buttonsBlock: {
    width: '300px',
    textAlign: 'right',
    '& > *': {
      marginLeft: '30px',
    },
  },
}));

const LinkRouter = (props: LinkRouterProps) => (
  <Link {...props} component={RouterLink as any} />
);

const NavBar = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const { data, selectedProject }: ProjectStateInterface = useSelector(
    (state: RootState) => state.projects
  );
  const breadcrumbNameMap: { [key: string]: any } = {
    '/': {
      label: 'Submissions',
      pagination: useSelector((state: any) => state.submissions.pagination),
      changePage: (page: number) => dispatch(getSubmissions(page)),
      buttons: (
        <>
          <IconButton
            title="Refresh"
            onClick={() => dispatch(getSubmissions())}
            aria-label="refresh"
          >
            <RefreshIcon />
          </IconButton>
          <LinkRouter color="inherit" to="/create" underline="none">
            <Button variant="contained" color="primary">
              Create Submission
            </Button>
          </LinkRouter>
        </>
      ),
    },
    '/create': {
      label: 'Create Submission',
      buttons: (
        <>
          <LinkRouter color="inherit" to="/" underline="none">
            <Button variant="outlined" color="primary">
              Back
            </Button>
          </LinkRouter>
          <Button
            variant="contained"
            color="primary"
            style={{
              visibility: 'hidden',
            }}
          >
            Create
          </Button>
        </>
      ),
    },
    '/tasks': {
      label: 'Tasks List',
      pagination: useSelector((state: any) => state.tasks.pagination),
      changePage: (page: number) => dispatch(getTasks(page)),
      buttons: (
        <>
          <IconButton
            title="Refresh"
            onClick={() => dispatch(getTasks())}
            aria-label="refresh"
          >
            <RefreshIcon />
          </IconButton>
          <LinkRouter color="inherit" to="/" underline="none">
            <Button variant="outlined" color="primary">
              Back
            </Button>
          </LinkRouter>
        </>
      ),
    },
  };

  return (
    <AppBar classes={{ root: classes.navbar }} position="static">
      <Toolbar disableGutters variant="dense">
        <FormControl classes={{ root: classes.formControl }} variant="filled">
          <Select
            variant="filled"
            value={selectedProject}
            classes={{ filled: classes.filledInput }}
            inputProps={{
              margin: 'none',
            }}
            onChange={(e) => dispatch(setProject(e.target.value as string))}
          >
            {data.map(({ connector_key, connector_name }) => (
              <MenuItem key={connector_key} value={connector_key}>
                {connector_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className={classes.navBarContainer}>
          <Route>
            {({ location }) => {
              const pathnames = location.pathname.split('/').filter((x) => x);
              let lastPath = '/';
              return (
                <>
                  <Breadcrumbs aria-label="breadcrumb">
                    <LinkRouter color="inherit" to="/" underline="none">
                      {breadcrumbNameMap['/'].label}
                    </LinkRouter>
                    {pathnames.map((_value, index) => {
                      const last = index === pathnames.length - 1;
                      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                      if (last && breadcrumbNameMap[to]) {
                        lastPath = to;
                      }
                      return last && breadcrumbNameMap[to] ? (
                        <Typography color="textPrimary" key={to}>
                          {breadcrumbNameMap[to].label}
                        </Typography>
                      ) : breadcrumbNameMap[to] ? (
                        <LinkRouter
                          color="inherit"
                          to={to}
                          key={to}
                          underline="none"
                        >
                          {breadcrumbNameMap[to].label}
                        </LinkRouter>
                      ) : null;
                    })}
                  </Breadcrumbs>
                  {breadcrumbNameMap[lastPath].pagination ? (
                    <TablePagination
                      pagination={breadcrumbNameMap[lastPath].pagination}
                      changePage={breadcrumbNameMap[lastPath].changePage}
                    />
                  ) : null}
                  {breadcrumbNameMap[lastPath].buttons ? (
                    <div className={classes.buttonsBlock}>
                      {breadcrumbNameMap[lastPath].buttons}
                    </div>
                  ) : null}
                </>
              );
            }}
          </Route>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
