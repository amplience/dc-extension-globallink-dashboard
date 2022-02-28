import { Dispatch } from 'redux';
import jp from 'jsonpath';
import throttle from 'lodash/throttle';
import {
  WorkflowState,
  DynamicContent,
  ContentGraph,
  ContentItem,
  Page,
} from 'dc-management-sdk-js';
import { AppDispatch, RootState } from '../store';
import { setError } from '../error/error.actions';
import {
  setContentLoader,
  setLoaderById,
  setTableLoader,
} from '../loadings/loadings.actions';
import {
  Pagination,
  RootStateInt,
  SubmissionInt,
  TaskInterface,
} from '../../types/types';
import { getSubmissions } from '../submissions/submissions.actions';

export const SET_TASKS = 'SET_TASKS';
export const SET_TASKS_PAGINATION = 'SET_TASKS_PAGINATION';

export const setTasks = (value: TaskInterface[]) => ({
  type: SET_TASKS,
  value,
});

export const setPagination = (value: Pagination) => ({
  type: SET_TASKS_PAGINATION,
  value,
});

const getAllLocalization = async (
  contentItem: ContentItem,
  localizations: ContentItem[] = [],
  pageNumber = 0
): Promise<ContentItem[]> => {
  const localizationPage: Page<ContentItem> =
    await contentItem.related.localizations({ size: 100, page: pageNumber });
  const items: ContentItem[] = localizationPage.getItems();
  localizations = localizations.concat(items);

  if (
    localizationPage &&
    localizationPage.page &&
    localizationPage.page.totalElements &&
    localizationPage.page.totalElements > localizations.length
  ) {
    return getAllLocalization(
      contentItem,
      localizations,
      (localizationPage.page.number || 0) + 1
    );
  }

  return localizations;
};

const throttled = throttle(getAllLocalization, 1000);

const getLocalizedAfterJobStarted = async (
  contentItem: ContentItem,
  locale: string
): Promise<ContentItem | undefined> => {
  let localized: ContentItem | undefined = new ContentItem({});

  do {
    const allLocalized = await throttled(contentItem);
    localized =
      allLocalized &&
      allLocalized.find(
        ({ locale: contentLocale }: ContentItem) => contentLocale === locale
      );
  } while (!localized);

  const allLocalized = await getAllLocalization(contentItem);
  localized = allLocalized.find(
    ({ locale: contentLocale }: ContentItem) => contentLocale === locale
  );

  return localized;
};

const getAllTasks = async ({
  Api,
  tasks,
  pageNumber,
  selectedProject,
  submissionId,
}: any): Promise<TaskInterface[]> => {
  const { total_records_count, tasks_list } = await Api.getTasks({
    selectedProject,
    selectedSubmission: submissionId,
    pageNumber: pageNumber || 1,
  });

  tasks = tasks.concat(
    tasks_list.filter(({ status }: any) => status === 'Completed')
  );

  if (total_records_count > tasks.length) {
    return getAllTasks({
      Api,
      tasks,
      pageNumber: pageNumber + 1,
      selectedProject,
      submissionId,
    });
  }

  return tasks;
};

export const applyAllTranslations =
  (submission: SubmissionInt) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      const {
        Api,
        projects,
        sdk: { SDK, params },
        submissions: {
          pagination: { page },
        },
      }: RootStateInt = getState();
      const dcManagement = new DynamicContent({}, {}, SDK && SDK.client);
      const failedCount = 0;

      dispatch(setContentLoader(true));
      dispatch(setLoaderById(submission.submission_id || 0, true));

      const allTasks = await getAllTasks({
        Api,
        tasks: [],
        pageNumber: 1,
        selectedProject: projects.selectedProject,
        submissionId: submission.submission_id,
      });

      for (let i = allTasks.length - 1; i >= 0; i--) {
        const {
          task_id = 0,
          unique_identifier,
          target_locale: { locale },
        } = allTasks[i];
        dispatch(setLoaderById(task_id, true));
        await downloadAndApply(
          {
            dcManagement,
            Api,
            task_id,
            unique_identifier,
            locale,
            selectedProject: projects.selectedProject,
            params,
            source_locale: submission.source_locale,
          },
          dispatch
        );
        dispatch(setLoaderById(task_id, false));
      }

      if (failedCount) {
        dispatch(
          setError(
            `Failed to apply translation to ${failedCount} content items. Check, please, if localized content items exist`
          )
        );
      }

      dispatch(setLoaderById(submission.submission_id || 0, false));
      dispatch(setContentLoader(false));
      dispatch(getSubmissions(page || 0));
    } catch (e: any) {
      dispatch(setError(e.toString()));
      dispatch(setContentLoader(false));
    }
  };

const downloadAndApply = async (
  {
    dcManagement,
    selectedProject,
    Api,
    task_id,
    unique_identifier,
    locale,
    params,
    source_locale,
  }: any,
  dispatch: Dispatch<any>
) => {
  try {
    const sourceContentItem = await dcManagement.contentItems.get(
      unique_identifier
    );

    const allLocalized = await getAllLocalization(sourceContentItem);

    const resp = await Api.downloadTask(task_id, selectedProject);

    let contentItemToUpdate = allLocalized.find(
      ({ locale: contentLocale }: any) => contentLocale === locale
    );

    if (!contentItemToUpdate) {
      await sourceContentItem.related.localize([locale]);

      const localized: ContentItem | undefined =
        await getLocalizedAfterJobStarted(sourceContentItem, locale);

      contentItemToUpdate = await dcManagement.contentItems.get(
        localized && localized.id
      );
    } else {
      contentItemToUpdate = await dcManagement.contentItems.get(
        contentItemToUpdate.id
      );
    }

    const mapping: any = {};

    await ContentGraph.deepCopy(
      [sourceContentItem.id],
      dcManagement.contentItems.get,
      async (contentItem, body) => {
        if (mapping[contentItem.id]) {
          return mapping[contentItem.id];
        }

        if (contentItem.id === sourceContentItem.id) {
          const updatedBody = {
            ...(contentItemToUpdate && contentItemToUpdate.body),
          };

          (resp.translations || []).forEach(({ key, value }: any) => {
            if ((value && Array.isArray(value) && value.length) || value) {
              jp.apply(updatedBody, `$.${key}`, () =>
                value && value.length && value.length === 1 ? value[0] : value
              );
            }
          });

          return (
            contentItemToUpdate &&
            (mapping[contentItemToUpdate.id] =
              await contentItemToUpdate.related.update({
                ...contentItemToUpdate.toJSON(),
                body: {
                  ...contentItemToUpdate.body,
                  ...body,
                  ...updatedBody,
                },
              }))
          );
        }

        if (source_locale && contentItem.locale === source_locale.locale) {
          const allNestedLocalized = await getAllLocalization(contentItem);

          let nestedLocalized = allNestedLocalized.find(
            ({ locale: contentLocale }: any) => contentLocale === locale
          );

          nestedLocalized = await dcManagement.contentItems.get(
            nestedLocalized && nestedLocalized.id
          );

          const updatedBodyObj = {
            ...(nestedLocalized && nestedLocalized.body),
          };

          const translations = resp.nested[contentItem.id];

          if (translations) {
            translations.forEach(({ key, value }: any) => {
              /* if (!updatedBodyObj[key]) {
                updatedBodyObj[key] =
                  (nestedLocalized && nestedLocalized.body && nestedLocalized.body[key]) || "";
              } */
              jp.apply(updatedBodyObj, `$.${key}`, () =>
                value && value.length && value.length === 1 ? value[0] : value
              );
            });

            if (!nestedLocalized && !contentItem.locale) {
              await contentItem.related.setLocale(source_locale.locale);
            }

            if (!nestedLocalized) {
              await contentItem.related.localize([locale]);

              let localized: ContentItem | undefined =
                await getLocalizedAfterJobStarted(contentItem, locale);

              localized = await dcManagement.contentItems.get(
                localized && localized.id
              );

              return (
                localized &&
                (mapping[localized.id] = await localized.related.update({
                  ...localized.toJSON(),
                  body: {
                    ...localized.body,
                    ...body,
                    ...updatedBodyObj,
                  },
                }))
              );
            }

            return (mapping[nestedLocalized.id] =
              await nestedLocalized.related.update({
                ...nestedLocalized.toJSON(),
                body: {
                  ...nestedLocalized.body,
                  ...body,
                  ...updatedBodyObj,
                },
              }));
          }
        }

        return (mapping[contentItem.id] = contentItem);
      }
    );

    await Api.updateTaskMetadata(task_id, selectedProject, {
      localizedId: contentItemToUpdate && contentItemToUpdate.id,
    });

    if (params.statuses && params.statuses.translated) {
      await sourceContentItem.related.assignWorkflowState(
        new WorkflowState({ id: params.statuses.translated })
      );
    }

    await Api.confirmDownload(task_id, selectedProject);

    return false;
  } catch (e: any) {
    dispatch(setError(e.message));
    return Api.errorTask(task_id, selectedProject, e.message);
  }
};

export const downloadTask =
  ({
    task_id,
    unique_identifier,
    source_locale,
    target_locale: { locale },
  }: any) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      dispatch(setContentLoader(true));
      const {
        Api,
        projects,
        sdk: { SDK, params },
        tasks: { pagination },
      }: RootStateInt = getState();
      const dcManagement = new DynamicContent({}, {}, SDK && SDK.client);

      await downloadAndApply(
        {
          dcManagement,
          Api,
          task_id,
          unique_identifier,
          locale,
          selectedProject: projects.selectedProject,
          params,
          source_locale,
        },
        dispatch
      );

      dispatch(getTasks(pagination.page || 0));
      dispatch(setContentLoader(false));
    } catch (e: any) {
      dispatch(setError(e.toString()));
      dispatch(setContentLoader(false));
    }
  };

export const cancelTask =
  ({ task_id }: any) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      const { Api, projects }: any = getState();

      dispatch(setContentLoader(true));

      await Api.cancelTask(task_id, projects.selectedProject);

      dispatch(getTasks(0));

      dispatch(setContentLoader(false));
    } catch (e: any) {
      if (e && e.message) {
        dispatch(setError(e.message));
      } else {
        dispatch(setError(e.toString()));
      }
      dispatch(setContentLoader(false));
    }
  };

export const getTasks =
  (pageNumber?: number) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const {
        Api,
        submissions,
        projects,
        tasks: {
          pagination: { page },
        },
      }: RootStateInt = getState();

      dispatch(setTableLoader(true));

      const {
        current_page_number,
        total_result_pages_count,
        tasks_list = [],
      } = await Api.getTasks({
        selectedProject: projects.selectedProject,
        selectedSubmission: submissions?.selectedSubmission?.submission_id || 0,
        pageNumber: pageNumber || page || 1,
      });

      dispatch(
        setTasks(
          tasks_list.map((el: any) => {
            el.due_date = submissions.selectedSubmission.due_date;
            el.source_locale = submissions.selectedSubmission.source_locale;
            el.state = submissions.selectedSubmission.state;
            return el;
          })
        )
      );
      dispatch(
        setPagination({
          page: current_page_number,
          totalCount: total_result_pages_count,
        })
      );
      dispatch(setTableLoader(false));
    } catch (e: any) {
      dispatch(setError(e.toString()));
      dispatch(setTableLoader(false));
    }
  };
