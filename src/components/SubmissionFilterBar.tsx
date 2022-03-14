import React, { useRef, useState } from 'react';
import {
  Popover,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Divider,
  Checkbox,
  FormGroup,
  TextField,
} from '@material-ui/core';
import PopupState, {
  bindTrigger,
  bindPopover,
  bindToggle,
} from 'material-ui-popup-state';
import IconButton from '@material-ui/core/IconButton';
import { useDispatch } from 'react-redux';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {
  getSubmissions,
  setFilter as setFilterValue,
} from '../store/submissions/submissions.actions';
import {
  Option,
  SubmissionFilterInt,
  SubmissionsFilterBarInterface,
} from '../types/types';
import { FilterStatus, useStyles } from './FilterBar';
import FilterIcon from '../styles/FilterIcon.svg';
import { SUBMISSION_STATUSES } from './Submissions';

const SubmissionFilterBar = ({
  filterOptions,
  filter: appliedFilter,
}: SubmissionsFilterBarInterface) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const filterRef = useRef(null);
  const [filter, setFilter] = useState<any>(appliedFilter);

  const applyFilter = (filterItem: SubmissionFilterInt, popupState: any) => {
    dispatch(setFilterValue(filterItem));
    dispatch(getSubmissions(1, filterItem));
    popupState.close();
  };

  const onRemoveFilterValue = (key: 'state', id: string) => {
    const currentList: string[] = filter[key] || [];

    if (currentList.includes(id)) {
      currentList.splice(currentList.indexOf(id), 1);

      setFilter({
        ...filter,
        [key]: currentList,
      });

      dispatch(
        getSubmissions(1, {
          ...filter,
          [key]: currentList,
        })
      );
    }
  };

  const onRemoveTextFilter = (key: string, value: string | number = '') => {
    setFilter({
      ...filter,
      [key]: value,
    });
    dispatch(
      setFilterValue({
        ...filter,
        [key]: value,
      })
    );

    dispatch(
      getSubmissions(1, {
        ...filter,
        [key]: value,
      })
    );
  };

  const FilterBlock = ({
    name,
    keyName,
    options,
  }: {
    name: string;
    keyName: 'state';
    options: Option[];
  }) => (
    <FormControl component="fieldset">
      <FormLabel component="legend">{name}</FormLabel>
      <FormGroup aria-label={name}>
        {options.map(({ label, value }: Option, index) => (
          <FormControlLabel
            key={index}
            value={value}
            control={
              <Checkbox
                checked={filter[keyName] && filter[keyName].includes(value)}
                className={classes.radio}
                onChange={() => handleChange(keyName, value || '')}
                color="primary"
              />
            }
            label={`${label}`}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
  const handleChange = (key: 'state', id: any) => {
    const currentList: string[] = filter[key] || [];

    if (currentList.includes(id)) {
      currentList.splice(currentList.indexOf(id), 1);

      return setFilter({
        ...filter,
        [key]: currentList,
      });
    }

    return setFilter({
      ...filter,
      [key]: [...currentList, id],
    });
  };

  return (
    <PopupState variant="popover" popupId="demo-popup-popover">
      {(popupState) => (
        <div className={classes.filterBar}>
          <div className={classes.filterStatus}>
            <div>
              <h3 className={classes.filterName}>Status</h3>
              <div className={classes.filterValue}>
                {appliedFilter.state.length ? (
                  appliedFilter.state.map((state) => (
                    <FilterStatus
                      key={state}
                      popupState={popupState}
                      label={SUBMISSION_STATUSES[state] || state}
                      value={state}
                      onClear={() => onRemoveFilterValue('state', state)}
                    />
                  ))
                ) : (
                  <a {...bindTrigger(popupState)}>All</a>
                )}
              </div>
            </div>
            {appliedFilter.submission_name ? (
              <div>
                <h3 className={classes.filterName}>Submission Name</h3>
                <div className={classes.filterValue}>
                  <FilterStatus
                    popupState={popupState}
                    label={
                      SUBMISSION_STATUSES[appliedFilter.submission_name] ||
                      appliedFilter.submission_name
                    }
                    value={appliedFilter.submission_name}
                    onClear={() => onRemoveTextFilter('submission_name')}
                  />
                </div>
              </div>
            ) : null}
            <div>
              <h3 className={classes.filterName}>Submitter</h3>
              <div className={classes.filterValue}>
                {appliedFilter.submitter ? (
                  <FilterStatus
                    popupState={popupState}
                    label={appliedFilter.submitter}
                    value={appliedFilter.submitter}
                    onClear={() => onRemoveTextFilter('submitter')}
                  />
                ) : (
                  <a {...bindTrigger(popupState)}>All</a>
                )}
              </div>
            </div>
            {appliedFilter.is_error || appliedFilter.is_overdue ? (
              <div>
                <h3 className={classes.filterName}>Options</h3>
                <div className={classes.filterValue}>
                  {appliedFilter.is_error ? (
                    <FilterStatus
                      popupState={popupState}
                      label="Error"
                      value={appliedFilter.is_error}
                      onClear={() => onRemoveTextFilter('is_error', 0)}
                    />
                  ) : null}
                  {appliedFilter.is_overdue ? (
                    <FilterStatus
                      popupState={popupState}
                      label="Overdue"
                      value={appliedFilter.is_overdue}
                      onClear={() => onRemoveTextFilter('is_overdue', 0)}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <IconButton
            ref={filterRef}
            className={classes.filterBtn}
            aria-label="toggle"
            size="small"
            {...bindTrigger(popupState)}
          >
            <img alt="filterIcon" src={FilterIcon} />
          </IconButton>
          <Popover
            {...bindPopover(popupState)}
            anchorReference="anchorEl"
            anchorEl={filterRef.current}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            onClose={() => {
              setFilter(appliedFilter);
              popupState.close();
            }}
          >
            <div className={classes.popover}>
              <div className={classes.filterHeading}>
                <TextField
                  placeholder="Submission name"
                  name="label"
                  style={{
                    minWidth: 250,
                  }}
                  value={filter.submission_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilter({
                      ...filter,
                      submission_name: e.target.value,
                    })
                  }
                />
                <div>
                  <Button variant="text" {...bindToggle(popupState)}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    variant="contained"
                    onClick={() => applyFilter(filter, popupState)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              <div className={classes.filterOptions}>
                <FilterBlock
                  name="Status"
                  keyName="state"
                  options={filterOptions.state}
                />
                <Divider flexItem orientation="vertical" />
                <FormControl component="fieldset">
                  <FormLabel component="legend">Options</FormLabel>
                  <FormGroup>
                    {[
                      {
                        label: 'Error',
                        value: 1,
                        key: 'is_error',
                      },
                      {
                        label: 'Overdue',
                        value: 1,
                        key: 'is_overdue',
                      },
                    ].map(({ label, value, key }: Option) => (
                      <FormControlLabel
                        key={key}
                        value={value}
                        control={
                          <Checkbox
                            checked={Boolean(filter[key])}
                            className={classes.radio}
                            onChange={() =>
                              setFilter({
                                ...filter,
                                [key]: filter[key] ? 0 : 1,
                              })
                            }
                            color="primary"
                          />
                        }
                        label={label}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
                <Divider flexItem orientation="vertical" />
                <Autocomplete
                  options={filterOptions.submitters}
                  getOptionLabel={(option: any) => (option ? option.label : '')}
                  id="submitter"
                  fullWidth
                  freeSolo
                  style={{
                    minWidth: 250,
                  }}
                  onChange={(_event, newValue) => {
                    if (
                      typeof newValue !== 'string' &&
                      newValue &&
                      newValue.value
                    ) {
                      setFilter({
                        ...filter,
                        submitter: newValue.value || '',
                      });
                    }
                  }}
                  onInputChange={(_event, newValue) =>
                    setFilter({
                      ...filter,
                      submitter: newValue,
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Submitter" margin="normal" />
                  )}
                />
              </div>
            </div>
          </Popover>
        </div>
      )}
    </PopupState>
  );
};

export default SubmissionFilterBar;
