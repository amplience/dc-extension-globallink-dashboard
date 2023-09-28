import { ContentItem } from 'dc-management-sdk-js';
import { useSelector } from 'react-redux';
import { Typography } from '@material-ui/core';
import { RootState } from '../store/store';
import Table from './common/Table';
import Loader from './common/Loader';
import { ContentItemsInterface } from '../types/types';
import { PAGE_SIZE } from '../utils/GCCRestApi';

const Basket = ({
  selectedContent,
}: {
  selectedContent: string[];
}) => {
  const { data, pagination }: ContentItemsInterface = useSelector(
    (state: RootState) => state.contentItems
  );
  const { content }: any = useSelector((state: RootState) => state.loadings);
  const {
    params: { maxContentInSubmission = 50 },
  }: any = useSelector((state: RootState) => state.sdk);

  const slicedData = data.filter((item: ContentItem) =>
    selectedContent.includes(item.id)
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

  return (
    <>
      {content ? <Loader className="content-loader" /> : null}
      <Typography
        color={
          slicedData.length < maxContentInSubmission
            ? 'textPrimary'
            : 'textSecondary'
        }
        variant="body1"
        style={{ paddingBottom: 4 }}
      >
        Content Items Basket: {slicedData.length} / {maxContentInSubmission}
      </Typography>
      <Table
        maxContentInSubmission={maxContentInSubmission}
        columns={columns}
        data={slicedData}
        currentPage={pagination.page}
        pageSize={PAGE_SIZE}
      />
    </>
  );
};

export default Basket;
