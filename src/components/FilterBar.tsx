import React, { useEffect, useRef, useState } from 'react';
import {
  Popover,
  Button,
  makeStyles,
  FormControl,
  FormControlLabel,
  RadioGroup,
  FormLabel,
  Radio,
  Divider,
  Checkbox,
  FormGroup,
  TextField,
  Box,
  Typography,
} from '@material-ui/core';
import ShoppingBasketIcon from '@material-ui/icons/ShoppingBasket';
import Refresh from '@material-ui/icons/Refresh';
import PopupState, {
  bindTrigger,
  bindPopover,
  bindToggle,
} from 'material-ui-popup-state';
import ClearIcon from '@material-ui/icons/Clear';
import IconButton from '@material-ui/core/IconButton';
import { useDispatch } from 'react-redux';
import {
  getContentItems,
  setFilter as setFilterValue,
} from '../store/contentItems/contentItems.actions';
import { FilterBarInterface, FilterInt, Option } from '../types/types';
import FilterIcon from '../styles/FilterIcon.svg';

export const useStyles = makeStyles(() => ({
  filterBtn: {
    backgroundColor: '#c5c5c5',
    padding: 0,
    margin: 0,
    height: 24,
    width: 24,
    minHeight: 24,
    minWidth: 24,
    borderRadius: 3,
    '& image': {
      width: 24,
      height: 24,
    },
    '&:hover': {
      backgroundColor: '#c5c5c5',
    },
  },
  basketBtn: {
    backgroundColor: '#c5c5c5',
    padding: '0px 5px 0px 5px',
    margin: '0px 10px 0px 0px',
    height: 24,
    minHeight: 24,
    minWidth: 24,
    borderRadius: 3,
    '& image': {
      width: 24,
      height: 24,
    },
    '&:hover': {
      backgroundColor: '#c5c5c5',
    },
  },
  filterBar: {
    display: 'flex',
    margin: '10px 0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterStatus: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    '& > div': {
      display: 'flex',
      alignItems: 'center',
    },
    '& button': {
      height: 12,
      width: 12,
      minWidth: 12,
      minHeight: 12,
      cursor: 'pointer',
      margin: '2px 0 0 8px',
      '& svg': {
        width: 13,
        height: 13,
      },
    },
    '& > button, a': {
      border: 'none',
      borderRadius: 8,
      padding: '2px 8px',
      margin: '4px 8px 4px 0',
      backgroundColor: '#f2f2f2',
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      width: 'unset',
      height: 'unset',
      minWidth: 'unset',
      minHeight: 'unset',
    },
    '& label': {
      fontSize: 12,
      color: '#333',
      fontWeight: 400,
      margin: '3px 0',
      cursor: 'pointer',
    },
  },
  filterName: {
    fontSize: 12,
    color: '#666',
    margin: '0 8px 0 0',
    fontWeight: 400,
    fontFamily: 'Roboto',
  },
  filterValue: {
    display: 'flex',
    margin: '5px 0',
    '& button': {
      height: 12,
      width: 12,
      minWidth: 12,
      minHeight: 12,
      cursor: 'pointer',
      margin: '2px 0 0 8px',
      '& svg': {
        width: 13,
        height: 13,
      },
    },
    '& > button, a': {
      border: 'none',
      borderRadius: 8,
      padding: '2px 8px',
      margin: '4px 8px 4px 0',
      backgroundColor: '#f2f2f2',
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      width: 'unset',
      height: 'unset',
      minWidth: 'unset',
      minHeight: 'unset',
    },
  },
  popover: {
    minWidth: 600,
  },
  filterHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottom: '1px solid #e5e5e5',

    '& h3': {
      fontSize: 14,
      fontWeight: 500,
      margin: 0,
    },

    '& button': {
      marginRight: 20,
      height: 30,
      lineHeight: 30,
      minHeight: 30,
      borderRadius: 3,
      boxShadow: 'none!important',
    },
  },
  filterOptions: {
    display: 'flex',
    padding: '0 8px 16px 16px',

    '& > fieldset': {
      minWidth: 200,
    },

    '& legend': {
      fontSize: 14,
      fontWeight: 500,
      padding: '23px 0',
      color: 'rgba(0, 0, 0, 0.87)',
    },

    '& span': {
      transition: 'opacity .15s',
      marginBottom: 0,
      outline: 'none',
      fontSize: 13,
    },

    '& hr': {
      margin: '0 16px',
    },
  },
  radio: {
    '& svg': {
      width: 16,
      height: 16,
    },
  },
}));

export const FilterStatus = ({ label, onClear }: any) => (
  <button type="reset">
    {label}
    <IconButton size="small" onClick={onClear}>
      <ClearIcon />
    </IconButton>
  </button>
);

const FilterBar = ({
  setOpenBasket,
  total,
  max,
  facets,
  locale,
  filter: appliedFilter,
}: FilterBarInterface) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const filterRef = useRef(null);
  const [filter, setFilter] = useState<FilterInt>(appliedFilter);

  useEffect(() => {
    dispatch(getContentItems(locale, 1, filter, true));
  }, [filter, locale, dispatch]);

  const applyFilter = (
    filterItem: FilterInt,
    popupState: any,
    onlyFacets?: boolean
  ) => {
    dispatch(setFilterValue(filterItem));
    dispatch(getContentItems(locale, 1, filterItem, onlyFacets, !onlyFacets));
    popupState.close();
  };

  const onRemoveFilterValue = (
    key: 'assignees' | 'contentTypes',
    id: string
  ) => {
    const currentList: string[] = filter[key] || [];

    if (currentList.includes(id)) {
      currentList.splice(currentList.indexOf(id), 1);

      setFilter({
        ...filter,
        [key]: currentList,
      });

      dispatch(
        getContentItems(locale, 1, {
          ...filter,
          [key]: currentList,
        })
      );
    }
  };

  const handleChange = (key: 'assignees' | 'contentTypes', id: any) => {
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

  const FilterBlock = ({
    name,
    keyName,
    options,
  }: {
    name: string;
    keyName: 'assignees' | 'contentTypes';
    options: Option[];
  }) => (
    <FormControl component="fieldset">
      <FormLabel component="legend">{name}</FormLabel>
      <FormGroup aria-label={name}>
        {options.map(({ label, value, count }: Option, index) => (
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
            label={`${label} (${count})`}
          />
        ))}
      </FormGroup>
    </FormControl>
  );

  const currentRepo = facets.repositories.find(
    (el) => el.value === filter.repositories
  );

  const clearFilter = (key = 'repositories') => {
    setFilter({
      ...filter,
      [key]: '',
    });
    dispatch(
      setFilterValue({
        ...filter,
        [key]: '',
      })
    );

    dispatch(
      getContentItems(locale, 1, {
        ...filter,
        [key]: '',
      })
    );
  };

  const clearAllFilters = () => {
    setFilter({
      contentTypes: [],
      assignees: [],
      repositories: '',
      text: '',
    });
    dispatch(
      setFilterValue({
        contentTypes: [],
        assignees: [],
        repositories: '',
        text: '',
      })
    );

    dispatch(
      getContentItems(locale, 1, {
        contentTypes: [],
        assignees: [],
        repositories: '',
        text: '',
      })
    );
  };

  const handleSetFilter = (e, key = 'repositories') => {
    setFilter({
      ...filter,
      [key]: e.target.value || '',
    });
  };

  return (
    <PopupState variant="popover" popupId="demo-popup-popover">
      {(popupState) => (
        <div className={classes.filterBar}>
          <div className={classes.filterStatus}>
            <h3 className={classes.filterName}>Repository</h3>
            {appliedFilter.repositories ? (
              <FilterStatus
                popupState={popupState}
                label={currentRepo && currentRepo.label}
                value={appliedFilter.repositories}
                onClear={() => clearFilter()}
              />
            ) : (
              <a {...bindTrigger(popupState)}>All</a>
            )}
            <h3 className={classes.filterName}>Assignee</h3>
            {appliedFilter.assignees.length ? (
              appliedFilter.assignees.map((id) => {
                const user = facets.assignees.find((el) => el.value === id);

                return (
                  user && (
                    <FilterStatus
                      popupState={popupState}
                      label={user && user.label}
                      value={id}
                      onClear={() => onRemoveFilterValue('assignees', id)}
                    />
                  )
                );
              })
            ) : (
              <a {...bindTrigger(popupState)}>All</a>
            )}
            <h3 className={classes.filterName}>Content Type</h3>
            {appliedFilter.contentTypes.length ? (
              appliedFilter.contentTypes.map((id) => {
                const ct = facets.contentTypes.find((el) => el.value === id);
                return (
                  ct && (
                    <FilterStatus
                      popupState={popupState}
                      label={ct && ct.label}
                      value={id}
                      onClear={() => onRemoveFilterValue('contentTypes', id)}
                    />
                  )
                );
              })
            ) : (
              <a {...bindTrigger(popupState)}>All</a>
            )}
            {filter.text ? (
              <div>
                <h3 className={classes.filterName}>Search</h3>
                <div className={classes.filterValue}>
                  <FilterStatus
                    popupState={popupState}
                    label={appliedFilter.text}
                    value={appliedFilter.text}
                    onClear={() => clearFilter('text')}
                  />
                </div>
              </div>
            ) : null}
            {appliedFilter.repositories ||
            appliedFilter.assignees.length ||
            appliedFilter.text ||
            appliedFilter.contentTypes.length ||
            filter.text ? (
              <div>
                <h3 className={classes.filterName}>Filters</h3>
                <div className={classes.filterValue}>
                  <FilterStatus
                    popupState={popupState}
                    label="Clear all"
                    value="clear-all"
                    onClear={() => clearAllFilters()}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <Box>
            <IconButton
              className={classes.basketBtn}
              aria-label="toggle"
              size="small"
              onClick={() => {
                dispatch(getContentItems(locale, 1, filter));
              }}
            >
              <Refresh />
            </IconButton>
            <IconButton
              className={classes.basketBtn}
              aria-label="toggle"
              size="small"
              onClick={() => {
                setOpenBasket(true);
              }}
            >
              <ShoppingBasketIcon />
              <Typography
                variant="caption"
                color={total < max ? 'textPrimary' : 'textSecondary'}
                style={{ paddingLeft: 2, paddingRight: 2 }}
              >
                {total}/{max}
              </Typography>
            </IconButton>
            <IconButton
              ref={filterRef}
              className={classes.filterBtn}
              aria-label="toggle"
              size="small"
              {...bindTrigger(popupState)}
            >
              <img alt="filter icon" src={FilterIcon} />
            </IconButton>
          </Box>
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
                  placeholder="Content item name"
                  name="label"
                  value={filter.text}
                  style={{
                    minWidth: 250,
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleSetFilter(e, 'text');
                  }}
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
                <FormControl component="fieldset">
                  <FormLabel component="legend">Repository</FormLabel>
                  <RadioGroup
                    aria-label="Repository"
                    name="repository"
                    value={filter.repositories}
                    onChange={(e) => handleSetFilter(e)}
                  >
                    <FormControlLabel
                      value=""
                      control={
                        <Radio className={classes.radio} color="primary" />
                      }
                      label="All"
                    />
                    {facets.repositories.map(({ value, label }, index) => (
                      <FormControlLabel
                        key={index}
                        value={value}
                        control={
                          <Radio className={classes.radio} color="primary" />
                        }
                        label={label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <Divider flexItem orientation="vertical" />
                <FilterBlock
                  name="Assignees"
                  keyName="assignees"
                  options={facets.assignees}
                />
                <Divider flexItem orientation="vertical" />
                <FilterBlock
                  name="Content Types"
                  keyName="contentTypes"
                  options={facets.contentTypes}
                />
              </div>
            </div>
          </Popover>
        </div>
      )}
    </PopupState>
  );
};

export default FilterBar;
