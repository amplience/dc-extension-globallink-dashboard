import { ContentItem } from 'dc-management-sdk-js';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Icon,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from '@material-ui/core';
import PopupState, {
  InjectedProps,
  bindMenu,
  bindTrigger,
} from 'material-ui-popup-state';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import InputIcon from '@material-ui/icons/Input';
import CloseIcon from '@material-ui/icons/Close';
import { RootState } from '../store/store';
import Table from './common/Table';
import Loader from './common/Loader';
import { ContentItemsInterface, SDKInterface } from '../types/types';
import { PAGE_SIZE } from '../utils/GCCRestApi';

const Basket = ({
  basketContent,
  removeFromBasket,
  setOpenBasket,
  getSelectedIds,
  selectedContent,
}: {
  basketContent: object[];
  setOpenBasket: (state: boolean) => void;
  removeFromBasket: (item: object) => void;
  getSelectedIds: (content: string[]) => void;
  selectedContent: string[];
}) => {
  const { pagination }: ContentItemsInterface = useSelector(
    (state: RootState) => state.contentItems
  );
  const { content }: any = useSelector((state: RootState) => state.loadings);
  const {
    params: { maxContentInSubmission = 50 },
  }: any = useSelector((state: RootState) => state.sdk);

  const slicedData = basketContent;

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

  return (
    <>
      <Box style={{ display: 'flex', justifyContent: 'right' }}>
        <IconButton size="small" onClick={() => setOpenBasket(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      {content ? <Loader className="content-loader" /> : null}
      <Typography
        color={
          slicedData.length < maxContentInSubmission
            ? 'textPrimary'
            : 'textSecondary'
        }
        variant="h6"
        style={{ paddingBottom: 8 }}
      >
        Content Items Basket: {slicedData.length}/{maxContentInSubmission}
      </Typography>
      <Table
        // removeButton
        maxContentInSubmission={maxContentInSubmission}
        columns={columns}
        data={slicedData}
        removeFromBasket={removeFromBasket}
        getSelectedIds={getSelectedIds}
        selectedContent={selectedContent}
        currentPage={pagination.page}
        pageSize={PAGE_SIZE}
      />
      <Box style={{ marginTop: 20, display: 'flex', justifyContent: 'left' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenBasket(false)}
        >
          Close
        </Button>
      </Box>
    </>
  );
};

export default Basket;
