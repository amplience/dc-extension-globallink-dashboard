import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  loadingDots: {
    textAlign: 'center',
    width: 'calc(100% - 20px)',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    height: '50px',

    '&.tableLoader': {
      justifyContent: 'flex-start',
    },
    '&.tableLoader > div': {
      height: '4px',
      width: '4px',
    },
  },
  loadingDotsDot: {
    animation: 'dot-keyframes 1.5s infinite ease-in-out',
    backgroundColor: '#666666',
    borderRadius: '8px',
    display: 'inline-block',
    height: '8px',
    width: '8px',
    marginRight: '4px',

    '&:nth-child(2)': {
      animationDelay: '0.5s',
    },
    '&:nth-child(3)': {
      animationDelay: '1s',
    },
  },
}));

const Loader = ({ className = '' }: any) => {
  const classes = useStyles();

  return (
    <div title="Loading..." className={`${classes.loadingDots} ${className}`}>
      <div className={classes.loadingDotsDot} />
      <div className={classes.loadingDotsDot} />
      <div className={classes.loadingDotsDot} />
    </div>
  );
};

export default Loader;
