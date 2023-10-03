import { ContentItem } from 'dc-management-sdk-js';
import { useSelector } from 'react-redux';
import { Box, Button, IconButton, Typography } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { RootState } from '../store/store';
import Table from './common/Table';
import Loader from './common/Loader';
import { ContentItemsInterface } from '../types/types';
import { PAGE_SIZE } from '../utils/GCCRestApi';

const Basket = ({
  selectedContent,
  setOpenBasket,
}: {
  selectedContent: string[];
  setOpenBasket: (state: boolean) => void;
}) => {
  const { data, pagination }: ContentItemsInterface = useSelector(
    (state: RootState) => state.contentItems
  );
  const { content }: any = useSelector((state: RootState) => state.loadings);
  const {
    params: { maxContentInSubmission = 50 },
  }: any = useSelector((state: RootState) => state.sdk);

  const slicedData = data.filter(
    (item: ContentItem) => item && selectedContent.includes(item.id)
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

  return (
    <>
      <Box style={{ display: 'flex', justifyContent: 'right' }}>
        <IconButton onClick={() => setOpenBasket(false)}>
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
        maxContentInSubmission={maxContentInSubmission}
        columns={columns}
        data={slicedData}
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
