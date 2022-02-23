import { createBrowserHistory } from 'history';
import { Snackbar } from '@material-ui/core';
import { Warning } from '@material-ui/icons';
import { useSelector, useDispatch } from 'react-redux';
import {
  makeStyles,
  createTheme,
  ThemeProvider,
} from '@material-ui/core/styles';
import { RootState } from './store/store';
import { setError } from './store/error/error.actions';
import RouterComponent from './Router';

export const history = createBrowserHistory();

const useStyles = makeStyles(() => ({
  svg: {
    verticalAlign: 'middle',
  },
}));

const theme = createTheme({
  palette: {
    primary: {
      light: '#1ab0f9',
      main: '#039be5',
      dark: '#1ab0f9',
      contrastText: '#fff',
    },
  },
});

const App = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const { error } = useSelector((state: RootState) => ({
    error: state.error,
  }));

  const message = (
    <span>
      <Warning className={classes.svg} />
      {error}
    </span>
  );

  return (
    <ThemeProvider theme={theme}>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={8000}
        open={Boolean(error)}
        onClose={() => dispatch(setError(''))}
        message={message}
      />

      <RouterComponent />
    </ThemeProvider>
  );
};

export default App;
