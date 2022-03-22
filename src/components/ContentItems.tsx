import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core';
import { RootState } from '../store/store';
import Table from './common/Table';
import Loader from './common/Loader';
import FilterBar from './FilterBar';
import TablePagination from './common/TablePagination';
import { getContentItems } from '../store/contentItems/contentItems.actions';
import { ContentItemsInterface } from '../types/types';
import { PAGE_SIZE } from '../utils/GCCRestApi';

const useStyles = makeStyles(() => ({
  navBarContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

const ContentItems = ({
  locale,
  getSelectedIds,
}: {
  locale: string;
  getSelectedIds: (content: string[]) => void;
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { data, pagination, facets, filter }: ContentItemsInterface =
    useSelector((state: RootState) => state.contentItems);
  const { content }: any = useSelector((state: RootState) => state.loadings);
  const {
    params: { maxContentInSubmission = 50 },
  }: any = useSelector((state: RootState) => state.sdk);

  const slicedData = data.slice(
    (pagination.page - 1) * PAGE_SIZE,
    (pagination.page - 1) * PAGE_SIZE + PAGE_SIZE
  );

  const columns = [
    {
      id: 'label',
      label: 'Name',
    },
    {
      id: 'assignees',
      label: 'Assign',
      format: (assignees: any[]) =>
        assignees && assignees.length
          ? assignees
              .map(({ firstName, lastName }) => `${firstName} ${lastName}`)
              .join(', ')
          : '',
    },
    {
      id: 'schema',
      label: 'Content Type',
      format: (schema: any) =>
        schema && schema.settings ? schema.settings.label : '',
    },
  ];

  useEffect(() => {
    if (pagination && !pagination.page) {
      dispatch(getContentItems(locale, 1));
    }
  }, [pagination, dispatch, locale]);

  return (
    <>
      {content ? <Loader className="content-loader" /> : null}
      <FilterBar facets={facets} locale={locale} filter={filter} />

      <div className={classes.navBarContainer}>
        <TablePagination
          pagination={pagination}
          changePage={(page: number) => dispatch(getContentItems(locale, page))}
        />
      </div>

      <Table
        maxContentInSubmission={maxContentInSubmission}
        checkBox
        getSelectedIds={getSelectedIds}
        columns={columns}
        data={slicedData}
        currentPage={pagination.page}
      />
    </>
  );
};

export default ContentItems;
