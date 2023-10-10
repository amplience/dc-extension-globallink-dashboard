import React, { useEffect } from 'react';
import {
  makeStyles,
  Table as TableComponent,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import isFunction from 'lodash/isFunction';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: any) => any;
}

interface TableComponentProps {
  columns: Column[];
  data: object[];
  selectedContent?: string[];
  currentPage: number;
  pageSize: number;
  maxContentInSubmission?: number;
  checkBox?: boolean;
  removeButton?: boolean;
  indexes?: boolean;
  rowClick?(id: number): void;
  getSelectedIds?: (content: string[]) => void;
  removeFromBasket?: (item: any) => void;
  addToBasket?: (item: any) => void;
}

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    maxHeight: '85%',
  },
}));

const Table = ({
  maxContentInSubmission = 50,
  columns,
  data,
  rowClick,
  currentPage = 0,
  pageSize = 10,
  checkBox = false,
  removeButton = false,
  indexes = false,
  selectedContent = [],
  getSelectedIds = () => {},
  removeFromBasket = () => {},
  addToBasket = () => {},
}: TableComponentProps) => {
  const classes = useStyles();
  const selectedMap: { [key: string]: boolean } = {};
  selectedContent.forEach((id: string) => {
    selectedMap[id] = true;
  });
  const [selected, setSelected] =
    React.useState<{ [key: string]: boolean }>(selectedMap);

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds: { [key: string]: boolean } = {};
      data.forEach((n: any) => {
        newSelecteds[n.id] = true;
      });

      setSelected({
        ...selected,
        ...newSelecteds,
      });
      getSelectedIds(
        Object.keys({
          ...selected,
          ...newSelecteds,
        })
      );

      return;
    }
    const newUnselecteds: { [key: string]: boolean } = { ...selected };
    data.forEach((n: any) => {
      delete newUnselecteds[n.id];
    });
    setSelected(newUnselecteds);
    getSelectedIds(Object.keys(newUnselecteds));
  };

  const isSelected = (id: string) => selected[id];

  const handleClick = (id: string) => {
    if (!selected[id]) {
      setSelected({
        ...selected,
        [id]: true,
      });
      addToBasket(data.find((item: any) => item.id === id));
      getSelectedIds(
        Object.keys({
          ...selected,
          [id]: true,
        })
      );
    } else {
      const sel = { ...selected };
      delete sel[id];
      setSelected(sel);
      getSelectedIds(Object.keys(sel));
      removeFromBasket(data.find((item: any) => item.id === id));
    }
  };

  const handleBasketClick = (id: string) => {
    removeFromBasket(data.find((item: any) => item.id === id));
  };

  const ids = data.map(({ id }: any) => id);
  const found = ids.reduce(
    (accumulator, id) => (selected[id] ? (accumulator += 1) : accumulator),
    0
  );

  useEffect(() => {
    const selectedMap: { [key: string]: boolean } = {};
    selectedContent.forEach((id: string) => {
      selectedMap[id] = true;
    });
    setSelected({
      ...selectedMap,
    });
    getSelectedIds(
      Object.keys({
        ...selectedMap,
      })
    );
  }, [selectedContent]);

  const checkedAll = data.length > 0 && found > 0 && data.length === found;
  return (
    <Paper className={classes.root}>
      <TableContainer style={{ maxHeight: '100%' }}>
        <TableComponent stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {removeButton ? (
                <TableCell padding="checkbox">
                  <IconButton
                    title="Remove all"
                    size="small"
                    color="primary"
                    onClick={() => {
                      setSelected({});
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </TableCell>
              ) : null}
              {checkBox ? (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={checkedAll}
                    disabled={
                      !checkedAll &&
                      (Object.keys(selected).length >=
                        maxContentInSubmission - data.length + 1 ||
                        data.length > maxContentInSubmission)
                    }
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              ) : null}
              {indexes ? (
                <TableCell style={{ fontWeight: 'bold' }}>#</TableCell>
              ) : null}
              {columns.map((column, index) => (
                <TableCell
                  key={index}
                  align={column.align}
                  style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row: any, index: number) => {
              const isItemSelected = isSelected(row.id) || false;

              return (
                <TableRow
                  onDoubleClick={() =>
                    rowClick && isFunction(rowClick) && rowClick(row)
                  }
                  style={{
                    cursor:
                      rowClick && isFunction(rowClick) ? 'pointer' : 'default',
                  }}
                  hover
                  role="checkbox"
                  tabIndex={-1}
                  key={`row_${index}`}
                >
                  {removeButton ? (
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        color="primary"
                        title="Remove"
                        onClick={() => handleBasketClick(row.id)}
                      >
                        <CloseIcon />
                      </IconButton>
                    </TableCell>
                  ) : null}
                  {checkBox ? (
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        disabled={
                          !isItemSelected &&
                          Object.keys(selected).length >= maxContentInSubmission
                        }
                        onChange={() => handleClick(row.id)}
                      />
                    </TableCell>
                  ) : null}
                  {indexes ? (
                    <TableCell key={`cell_${index}`}>
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                  ) : null}
                  {columns.map((column, ind) => {
                    const value = row[column.id];
                    return (
                      <TableCell
                        key={`cell_${index}_${ind}`}
                        align={column.align}
                      >
                        {column.format && isFunction(column.format)
                          ? column.format(value || row)
                          : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </TableComponent>
      </TableContainer>
    </Paper>
  );
};

Table.defaultProps = {
  maxContentInSubmission: 50,
  checkBox: false,
  removeButton: false,
  indexes: false,
  rowClick: null,
  selectedContent: [],
  getSelectedIds: () => {},
  removeFromBasket: () => {},
  addToBasket: () => {},
};

export default Table;
