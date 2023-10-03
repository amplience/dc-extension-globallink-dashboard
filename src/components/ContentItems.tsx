import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Drawer, makeStyles } from '@material-ui/core';
import { RootState } from '../store/store';
import Table from './common/Table';
import Loader from './common/Loader';
import FilterBar from './FilterBar';
import TablePagination from './common/TablePagination';
import { getContentItems } from '../store/contentItems/contentItems.actions';
import { ContentItemsInterface } from '../types/types';
import { PAGE_SIZE } from '../utils/GCCRestApi';
import Basket from './Basket';

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
  selectedContent,
  getSelectedIds,
}: {
  locale: string;
  selectedContent: string[];
  getSelectedIds: (content: string[]) => void;
}) => {
  const [openBasket, setOpenBasket] = useState(false);
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
      label: 'Assignees',
      format: (assignees: any[]) =>
        assignees && assignees.length
          ? assignees
              .filter((assignee) => assignee != null)
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
      <FilterBar
        total={selectedContent.length}
        max={maxContentInSubmission}
        setOpenBasket={setOpenBasket}
        facets={facets}
        locale={locale}
        filter={filter}
      />

      <div className={classes.navBarContainer}>
        <TablePagination
          pagination={pagination}
          changePage={(page: number) =>
            dispatch(getContentItems(locale, page, filter))
          }
        />
      </div>

      <Table
        maxContentInSubmission={maxContentInSubmission}
        checkBox
        indexes
        getSelectedIds={getSelectedIds}
        columns={columns}
        data={slicedData}
        currentPage={pagination.page}
        pageSize={PAGE_SIZE}
      />

      <Drawer
        variant="temporary"
        open={openBasket}
        anchor="right"
        PaperProps={{ style: { width: '50%', padding: 20 } }}
        onClose={() => setOpenBasket(false)}
      >
        <Basket selectedContent={selectedContent} />
      </Drawer>
    </>
  );
};

export default ContentItems;
