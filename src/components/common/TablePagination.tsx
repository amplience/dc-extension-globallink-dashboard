import React, { useRef, useEffect } from 'react';
import { Pagination, PaginationItem } from '@material-ui/lab';

interface TablePaginationInterface {
  pagination: {
    page: number;
    totalCount: number;
  };
  changePage: (page: number) => void;
}

const TablePagination = ({
  pagination,
  changePage,
}: TablePaginationInterface) => {
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const elseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startRef && startRef.current) {
      startRef.current.addEventListener('click', () => {
        changePage(2);
      });
    }

    if (endRef && endRef.current) {
      endRef.current.addEventListener('click', () => {
        changePage(pagination.totalCount - 1);
      });
    }
  });

  return pagination.totalCount && pagination.totalCount > 1 ? (
    <Pagination
      page={pagination.page}
      count={pagination.totalCount}
      defaultPage={pagination.page}
      siblingCount={0}
      boundaryCount={1}
      renderItem={(item: any) => (
        <PaginationItem
          {...item}
          ref={
            item.type === 'start-ellipsis'
              ? startRef
              : item.type === 'end-ellipsis'
              ? endRef
              : elseRef
          }
          page={
            item.type === 'start-ellipsis'
              ? 2
              : item.type === 'end-ellipsis'
              ? pagination.totalCount - 1
              : item.page
          }
          className={`dc-pagination ${
            item.type === 'start-ellipsis'
              ? 'start-ellipsis'
              : item.type === 'end-ellipsis'
              ? 'end-ellipsis'
              : ''
          }`}
        />
      )}
      onChange={(event, page) => {
        event.stopPropagation();
        changePage(page);
      }}
    />
  ) : null;
};

export default TablePagination;
