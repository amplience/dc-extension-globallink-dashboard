import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Drawer,
  Icon,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
  makeStyles,
} from '@material-ui/core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import InputIcon from '@material-ui/icons/Input';
import PopupState, {
  InjectedProps,
  bindMenu,
  bindTrigger,
} from 'material-ui-popup-state';
import { ContentItem } from 'dc-management-sdk-js';
import { RootState } from '../store/store';
import Table from './common/Table';
import Loader from './common/Loader';
import FilterBar from './FilterBar';
import TablePagination from './common/TablePagination';
import { getContentItems } from '../store/contentItems/contentItems.actions';
import { ContentItemsInterface, SDKInterface } from '../types/types';
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
  setSelectedIds,
  selectedContent,
}: {
  locale: string;
  setSelectedIds: (content: string[]) => void;
  selectedContent: string[];
}) => {
  const [openBasket, setOpenBasket] = useState(false);
  const [basketContent, setBasketContent] = useState<any[]>([]);

  const addToBasket = (item: ContentItem): void => {
    if (!basketContent.filter((element) => element.id === item.id).length) {
      setBasketContent([...basketContent, item]);
    }
  };

  const removeFromBasket = (item: any): void => {
    if (item == null) {
      setBasketContent([]);
    } else if (basketContent.includes(item)) {
      setBasketContent(
        basketContent.filter((element) => element.id !== item.id)
      );
    }
  };

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

  const { SDK }: SDKInterface = useSelector((state: RootState) => state.sdk);

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
    {
      id: 'menu',
      label: ' ',
      format: (row: ContentItem) => (
        <PopupState variant="popover" popupId="demo-popup-menu">
          {(popupState: InjectedProps) => (
            <>
              <Icon
                component="a"
                className="menu-icon"
                {...bindTrigger(popupState)}
              >
                <MoreHorizIcon fontSize="small" />
              </Icon>
              <Menu {...bindMenu(popupState)}>
                <MenuItem
                  style={{ width: '280px' }}
                  onClick={() => {
                    // @ts-ignore
                    if (SDK && SDK.applicationNavigator && SDK.options) {
                      const href = SDK.applicationNavigator.openContentItem(
                        { id: row.id },
                        { returnHref: true }
                      );
                      // @ts-ignore
                      SDK.options.window.open(href, '_blank');
                    }
                    popupState.close();
                  }}
                >
                  <ListItemIcon>
                    <InputIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography>View Source</Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        </PopupState>
      ),
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
        max={maxContentInSubmission}
        setOpenBasket={setOpenBasket}
        basketContent={basketContent}
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

      {slicedData && (
        <Table
          maxContentInSubmission={maxContentInSubmission}
          checkBox
          indexes
          removeFromBasket={removeFromBasket}
          addToBasket={addToBasket}
          setSelectedIds={setSelectedIds}
          selectedContent={selectedContent}
          columns={columns}
          data={slicedData}
          currentPage={pagination.page}
          pageSize={PAGE_SIZE}
        />
      )}
      <Drawer
        variant="temporary"
        open={openBasket}
        anchor="right"
        PaperProps={{ style: { width: '50%', padding: 20 } }}
        onClose={() => setOpenBasket(false)}
      >
        <Basket
          setOpenBasket={setOpenBasket}
          basketContent={basketContent}
          setSelectedIds={setSelectedIds}
          removeFromBasket={removeFromBasket}
          selectedContent={selectedContent}
        />
      </Drawer>
    </>
  );
};

export default ContentItems;
