import { Dispatch } from 'redux';
import jsonpath from 'jsonpath';
import throttle from 'lodash/throttle';
import {
  WorkflowState,
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

const getContentItemToUpdate = async ({
  locale,
  unique_identifier,
  dcManagement,
}) => {
  const sourceContentItem = await dcManagement.contentItems.get(
    unique_identifier
  );

  const allLocalized = await getAllLocalization(sourceContentItem);
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

  return {
    contentItemToUpdate,
    sourceContentItem,
  };
};

export const applyAllTranslations =
  (submission: SubmissionInt) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      const {
        Api,
        projects,
        sdk: { params, dcManagement },
        submissions: {
          pagination: { page },
        },
      }: RootStateInt = getState();
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

const defaultValue = (type: string) => {
  switch (type) {
    case 'array':
      return [];
    case 'string':
      return '';
    default:
      return {};
  }
};

const typeFromPathItem = (item: any) => {
  if (item.expression) {
    switch (item.expression.type) {
      case 'numeric_literal':
        return 'array';
      default:
        break;
    }
  }

  return 'object';
};

const ensureField = (node: any, pathString: string, fieldType: string) => {
  // Ensure the field referenced by the path exists.
  const path = jsonpath.parse(pathString);

  const root = node;

  for (let i = 0; i < path.length; i++) {
    const item = path[i];
    if (item.expression) {
      switch (item.expression.type) {
        case 'root':
          node = root;
          break;
        case 'identifier':
        case 'string_literal':
        case 'numeric_literal':
          let next;
          next = node[item.expression.value];

          if (!next) {
            // Field doesn't exist. Try to create it.
            let type = fieldType;

            if (i + 1 < path.length) {
              type = typeFromPathItem(path[i + 1]);
            }

            next = defaultValue(type);
            node[item.expression.value] = next;
          }

          node = next;
          break;
        default:
          break;
      }
    }
  }

  return node;
};

const applyToItem = async ({
  contentItemToUpdate,
  translations = [],
  body,
  updatedBodyObj,
}) => {
  translations.forEach(({ key, value }: any) => {
    if (value) {
      if (value != null) {
        ensureField(updatedBodyObj, `$.${key}`, typeof value);
      }

      jsonpath.apply(updatedBodyObj, `$.${key}`, () =>
        value && value.length && value.length === 1 ? value[0] : value
      );
    }
  });

  return contentItemToUpdate.related.update({
    ...contentItemToUpdate.toJSON(),
    body: {
      ...contentItemToUpdate.body,
      ...body,
      ...updatedBodyObj,
    },
  });
};

const deepApply = async ({
  sourceContentItem,
  contentItemToUpdate,
  dcManagement,
  translatedTask,
  source_locale,
  locale,
}) => {
  const mapping: any = {};

  await ContentGraph.deepCopy(
    [sourceContentItem.id],
    dcManagement.contentItems.get,
    async (contentItem, body) => {
      if (mapping[contentItem.id]) {
        return mapping[contentItem.id];
      }

      if (contentItemToUpdate && contentItem.id === sourceContentItem.id) {
        const updatedBody = {
          ...(contentItemToUpdate && contentItemToUpdate.body),
        };

        return (mapping[contentItemToUpdate.id] = applyToItem({
          contentItemToUpdate,
          translations: translatedTask.translations,
          body,
          updatedBodyObj: updatedBody,
        }));
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

        const translations = translatedTask.nested[contentItem.id];

        if (translations) {
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
              (mapping[localized.id] = await applyToItem({
                contentItemToUpdate: localized,
                translations,
                body,
                updatedBodyObj,
              }))
            );
          }

          return (
            nestedLocalized &&
            (mapping[nestedLocalized.id] = await applyToItem({
              contentItemToUpdate: nestedLocalized,
              translations,
              body,
              updatedBodyObj,
            }))
          );
        }
      }

      return (mapping[contentItem.id] = contentItem);
    }
  );
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
    const translatedTask = await Api.downloadTask(task_id, selectedProject);

    const { sourceContentItem, contentItemToUpdate } =
      await getContentItemToUpdate({
        locale,
        dcManagement,
        unique_identifier,
      });

    await deepApply({
      sourceContentItem,
      contentItemToUpdate,
      dcManagement,
      translatedTask,
      source_locale,
      locale,
    });

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
        sdk: { params, dcManagement },
        tasks: { pagination },
      }: RootStateInt = getState();

      if (!dcManagement) {
        return dispatch(setError('No DC Management SDK found'));
      }

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
      return dispatch(setContentLoader(false));
    } catch (e: any) {
      dispatch(setError(e.toString()));
      return dispatch(setContentLoader(false));
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
