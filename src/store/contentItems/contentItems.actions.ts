import { Dispatch } from 'redux';
import {
  ContentItem,
  ContentRepository,
  ContentType,
  EnumFacet,
  Hub,
  Page,
} from 'dc-management-sdk-js';
import compact from 'lodash/compact';
import { setError } from '../error/error.actions';
import { RootState } from '../store';
import { setContentLoader } from '../loadings/loadings.actions';
import { setContentTypes } from '../contentTypes/contentTypes.actions';
import {
  FacetsInt,
  FilterInt,
  Option,
  Pagination,
  RootStateInt,
} from '../../types/types';
import { PAGE_SIZE } from '../../utils/GCCRestApi';
import { withRetry } from '../../utils/withRetry';

export const SET_CONTENT_ITEMS = 'SET_CONTENT_ITEMS';
export const SET_CONTENT_ITEMS_PAGINATION = 'SET_CONTENT_ITEMS_PAGINATION';
export const SET_FACETS = 'SET_FACETS';
export const SET_FILTER = 'SET_FILTER';

export const setContent = (value: ContentItem[]) => ({
  type: SET_CONTENT_ITEMS,
  value,
});

export const setFacets = (value: FacetsInt) => ({
  type: SET_FACETS,
  value,
});

export const setFilter = (value: FilterInt) => ({
  type: SET_FILTER,
  value,
});

export const setPagination = (value: Pagination) => ({
  type: SET_CONTENT_ITEMS_PAGINATION,
  value,
});

const getAllContentTypes = async (
  hub: Hub,
  data: ContentType[] = [],
  pageNumber = 0
): Promise<ContentType[]> => {
  const contentTypePage: Page<ContentType> = await withRetry(
    hub.related.contentTypes.list,
    { size: 100, page: pageNumber }
  );
  const items = contentTypePage.getItems() as ContentType[];
  data = data.concat(items);

  if (
    contentTypePage &&
    contentTypePage.page &&
    contentTypePage.page.totalElements &&
    contentTypePage.page.totalElements > data.length
  ) {
    return getAllContentTypes(
      hub,
      data,
      (contentTypePage.page.number || 0) + 1
    );
  }

  return data;
};

export const getContentItems =
  (
    locale: string,
    pageNumber: number,
    filter?: any,
    onlyFacets?: boolean,
    clear?: boolean
  ) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const {
        sdk: {
          dcManagement,
          params: { projects, hubId, statuses },
        },
        contentTypes: { data: contentTypesList },
        users: { data: usersList },
        projects: { selectedProject },
        contentItems: { pagination, data },
      }: RootStateInt = getState();

      if (!dcManagement) {
        return dispatch(setError('No DC Management SDK found'));
      }

      dispatch(setContentLoader(true));

      const project = projects.find((el) => el.id === selectedProject);

      if (project && !project.contentTypes) {
        return dispatch(setError('No Content Types found in project'));
      }

      if (clear) {
        data.splice(0, data.length);
      }

      if (
        data &&
        data[(pageNumber - 1) * data.length] != null &&
        Math.ceil(data.length / 20) >= pageNumber &&
        !filter
      ) {
        dispatch(setContentLoader(false));
        return dispatch(
          setPagination({
            page: pageNumber,
            totalCount: pagination.totalCount,
          })
        );
      }

      const assigneeFilter: EnumFacet =
        filter && filter.assignees && filter.assignees.length
          ? {
              facetAs: 'ENUM',
              field: 'assignees',
              filter: {
                type: 'IN',
                values: filter && filter.assignees,
              },
            }
          : {
              facetAs: 'ENUM',
              field: 'assignees',
            };

      const uris: string[] = (project?.contentTypes || [])
        .filter((el: any) => !el.dependency)
        .map((el: any) => el.uri.toLowerCase());

      const hub = await withRetry(dcManagement.hubs.get, hubId);
      const facets = await withRetry(
        hub.related.contentItems.facet,
        {
          fields: [
            {
              facetAs: 'ENUM',
              field: 'schema',
              filter: {
                type: 'IN',
                values:
                  filter && filter.contentTypes && filter.contentTypes.length
                    ? filter.contentTypes.map((el: any) => el.toLowerCase())
                    : uris,
              },
            },
            {
              facetAs: 'ENUM',
              field: 'workflow.state',
              name: 'workflow',
              filter: {
                type: 'IN',
                values: [statuses && statuses.ready ? statuses.ready : ''],
              },
            },
            {
              facetAs: 'ENUM',
              field: 'locale',
              filter: {
                type: 'IN',
                values: [locale],
              },
            },
            assigneeFilter,
          ],
          returnEntities: !onlyFacets,
        },
        {
          query: `status:"ACTIVE"${
            filter && filter.repositories
              ? `contentRepositoryId:"${filter.repositories}"`
              : ''
          }${(filter && filter.text) || ''}`,
          page: pageNumber - 1,
          size: PAGE_SIZE,
          sort: 'lastModifiedDate,desc',
        }
      );

      const content = facets.getItems();
      const contentTypes =
        contentTypesList && !contentTypesList.length
          ? await getAllContentTypes(hub)
          : contentTypesList;

      dispatch(setContentTypes(contentTypes));

      if (facets && facets._facets) {
        dispatch(
          setFacets({
            assignees: compact(
              facets._facets.assignees.map(({ _id, count }) => {
                const user = usersList.find(
                  ({ id: userId }: { id: string }) => _id === userId
                );

                if (!user && _id === 'UNASSIGNED') {
                  return {
                    label: 'Unassigned',
                    value: _id,
                    count: parseInt(count, 10),
                  };
                }

                return (
                  user && {
                    label: `${user.firstName} ${user.lastName}`,
                    value: user.id,
                    count: parseInt(count, 10),
                  }
                );
              })
            ) as Option[],
            repositories: (
              await withRetry(hub.related.contentRepositories.list, {
                size: 100,
              })
            )
              .getItems()
              .map((el: ContentRepository) => ({
                label: el.label,
                value: el.id,
              })) as Option[],
            contentTypes: compact(
              facets._facets.schema.map(({ _id, count }) => {
                if (_id && uris.indexOf(_id) >= 0) {
                  const ct =
                    contentTypes &&
                    contentTypes.find(
                      ({ contentTypeUri }: any) =>
                        contentTypeUri &&
                        contentTypeUri.toLowerCase() === _id.toLowerCase()
                    );
                  return (
                    ct &&
                    ct.settings && {
                      label: ct.settings.label,
                      value: ct.contentTypeUri,
                      count: parseInt(count, 10),
                    }
                  );
                }

                return null;
              })
            ) as Option[],
          })
        );
      }

      if (onlyFacets) {
        return dispatch(setContentLoader(false));
      }

      const mappedContent: ContentItem[] = await Promise.all(
        content.map(async ({ id, label, schema, assignees = [] }) => {
          const ct =
            contentTypes &&
            contentTypes.find(
              ({ contentTypeUri }: any) => contentTypeUri === schema
            );
          return new ContentItem({
            id,
            label,
            schema: ct || {},
            assignees: assignees.map((assignee) =>
              usersList.find(
                ({ id: userId }: { id: string }) => assignee === userId
              )
            ),
          });
        })
      );

      const insert = (dest, src, offset) => {
        const newDest = [...dest];

        for (let i = 0; i < src.length; i++) {
          newDest[i + offset] = src[i];
        }

        return newDest;
      };

      const newContent = insert(
        data,
        mappedContent,
        (pageNumber - 1) * PAGE_SIZE
      );
      dispatch(setContent(newContent));

      if (facets && facets.page && facets.page.number !== undefined) {
        dispatch(
          setPagination({
            page: facets.page.number + 1,
            totalCount: facets.page.totalPages || 0,
          })
        );
      }

      return dispatch(setContentLoader(false));
    } catch (e: any) {
      dispatch(setError(e.toString()));
      return dispatch(setContentLoader(false));
    }
  };
