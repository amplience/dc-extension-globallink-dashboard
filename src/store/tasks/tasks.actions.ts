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
  setDialogLoader,
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
import {
  ContentDependencyInfo,
  ContentDependencyTree,
} from '../../utils/ContentDependencyTree';
import {
  createProgress,
  setProgress,
  setProgressError,
  setProgressStage,
  setProgressText,
  setProgressTitle,
} from '../loadings/loadProgress';

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
  totalFetched = 0,
}: any): Promise<TaskInterface[]> => {
  const { total_records_count, tasks_list } = await Api.getTasks({
    selectedProject,
    selectedSubmission: submissionId,
    pageNumber: pageNumber || 1,
  });

  totalFetched += tasks_list.length;

  tasks = tasks.concat(
    tasks_list.filter(({ status }: any) => status === 'Completed')
  );

  if (total_records_count > totalFetched) {
    return getAllTasks({
      Api,
      tasks,
      pageNumber: pageNumber + 1,
      selectedProject,
      submissionId,
      totalFetched,
    });
  }

  return tasks;
};

const getContentItemToUpdate = async ({
  locale,
  unique_identifier,
  dcManagement,
  loadProgress,
  dispatch,
}) => {
  setProgress(loadProgress, 0, `Getting root ${unique_identifier}`, dispatch);

  const sourceContentItem = await dcManagement.contentItems.get(
    unique_identifier
  );

  setProgress(
    loadProgress,
    1,
    `Checking for a localized version of ${sourceContentItem.label}.`,
    dispatch
  );
  const allLocalized = await getAllLocalization(sourceContentItem);
  let contentItemToUpdate = allLocalized.find(
    ({ locale: contentLocale }: any) => contentLocale === locale
  );

  if (!contentItemToUpdate) {
    setProgress(
      loadProgress,
      2,
      `Creating a localized version of ${sourceContentItem.label}.`,
      dispatch
    );
    await sourceContentItem.related.localize([locale]);

    const localized: ContentItem | undefined =
      await getLocalizedAfterJobStarted(sourceContentItem, locale);

    setProgress(
      loadProgress,
      3,
      `Fetching localized version of ${sourceContentItem.label}.`,
      dispatch
    );
    contentItemToUpdate = await dcManagement.contentItems.get(
      localized && localized.id
    );
  } else {
    setProgress(
      loadProgress,
      3,
      `Fetching existing localized version of ${sourceContentItem.label}.`,
      dispatch
    );

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
    const loadProgress = createProgress('Fetching tasks...', 1);
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
          name,
        } = allTasks[i];

        setProgressTitle(
          loadProgress,
          `Applying Task ${name}... (${allTasks.length - i}/${
            allTasks.length
          })`,
          4,
          dispatch
        );

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
            loadProgress,
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
      dispatch(setDialogLoader(undefined));
    } catch (e: any) {
      setProgressError(loadProgress, e, dispatch);
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

const generateLocaleDeliveryKey = (
  key: string | undefined,
  locale: string
): string | undefined => {
  if (key == null) {
    return undefined;
  }

  return `${key}_${locale}`;
};

const updateDependencyLocales = async (
  result,
  locale,
  contentGet,
  loadProgress,
  dispatch
) => {
  const tree = new ContentDependencyTree([
    { repo: null as any, content: result },
  ]);

  const item = tree.all[0];
  for (let i = 0; i < item.dependencies.length; i++) {
    const target = item.dependencies[i];

    const { id } = target.dependency;
    setProgressText(
      loadProgress,
      `Updating ${result.label} (${locale}) dependency ${id}.`,
      dispatch
    );

    // Fetch the content for ID, and determine if it has the target locale.
    const refItem = (await contentGet(id)) as ContentItem;

    if (refItem.locale != null && refItem.locale !== locale) {
      // If it has a locale and it doesn't match the target, see if there is a localized version that can be substituted.
      const rewriteItem = await getLocalizedAfterJobStarted(refItem, locale);

      if (rewriteItem) {
        updateDependency(target, rewriteItem.id);
      }
    }
  }
};

const updateDependency = (
  dep: ContentDependencyInfo,
  id: string | undefined
) => {
  if (dep.dependency._meta.schema === '_hierarchy') {
    dep.owner.content.body._meta.hierarchy.parentId = id;
  } else if (dep.parent) {
    const { parent } = dep;
    if (id == null) {
      delete parent[dep.index];
    } else {
      parent[dep.index] = dep.dependency;
      dep.dependency.id = id;
    }
  }
};

const applyToItem = async ({
  contentItemToUpdate,
  translations = [],
  body,
  updatedBodyObj,
  locale,
  contentGet,
  loadProgress,
  dispatch,
}) => {
  setProgressText(
    loadProgress,
    `Applying translations to ${contentItemToUpdate.label} (${locale}).`,
    dispatch
  );
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

  updatedBodyObj._meta.deliveryKey = generateLocaleDeliveryKey(
    body._meta.deliveryKey,
    locale
  );

  const result = {
    ...contentItemToUpdate.toJSON(),
    body: {
      ...contentItemToUpdate.body,
      ...body,
      ...updatedBodyObj,
    },
  };

  await updateDependencyLocales(
    result,
    locale,
    contentGet,
    loadProgress,
    dispatch
  );

  setProgressText(
    loadProgress,
    `Updating ${contentItemToUpdate.label} (${locale}).`,
    dispatch
  );
  return contentItemToUpdate.related.update(result);
};

const getUpdatedBody = (contentItemToUpdate, contentItem) => ({
  ...(contentItem && contentItem.body),
  _meta: contentItemToUpdate?._meta ?? contentItem?.body?._meta,
});

const deepApply = async ({
  sourceContentItem,
  contentItemToUpdate,
  dcManagement,
  translatedTask,
  source_locale,
  locale,
  loadProgress,
  dispatch,
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
        const updatedBody = getUpdatedBody(contentItemToUpdate, contentItem);

        return (mapping[contentItemToUpdate.id] = applyToItem({
          contentItemToUpdate,
          translations: translatedTask.translations,
          body,
          updatedBodyObj: updatedBody,
          locale,
          contentGet: dcManagement.contentItems.get,
          loadProgress,
          dispatch,
        }));
      }

      if (source_locale && contentItem.locale === source_locale.locale) {
        setProgressText(
          loadProgress,
          `Fetching localized '${contentItem.label}'`,
          dispatch
        );

        const allNestedLocalized = await getAllLocalization(contentItem);

        let nestedLocalized = allNestedLocalized.find(
          ({ locale: contentLocale }: any) => contentLocale === locale
        );

        nestedLocalized = await dcManagement.contentItems.get(
          nestedLocalized && nestedLocalized.id
        );

        const updatedBodyObj = getUpdatedBody(nestedLocalized, contentItem);

        const translations = translatedTask.nested[contentItem.id];

        if (translations) {
          if (!nestedLocalized && !contentItem.locale) {
            setProgressText(
              loadProgress,
              `Setting source locale for '${contentItem.label}'`,
              dispatch
            );

            await contentItem.related.setLocale(source_locale.locale);
          }

          if (!nestedLocalized) {
            setProgressText(
              loadProgress,
              `Creating locale ${locale} for '${contentItem.label}'`,
              dispatch
            );

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
                locale,
                contentGet: dcManagement.contentItems.get,
                loadProgress,
                dispatch,
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
              locale,
              contentGet: dcManagement.contentItems.get,
              loadProgress,
              dispatch,
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
    loadProgress,
  }: any,
  dispatch: Dispatch<any>
) => {
  try {
    setProgressStage(loadProgress, 0, 'Downloading task...', 1, dispatch);
    setProgress(loadProgress, 0, 'Downloading task.', dispatch);
    const translatedTask = await Api.downloadTask(task_id, selectedProject);

    setProgressStage(
      loadProgress,
      1,
      'Fetching content to update...',
      4,
      dispatch
    );
    const { sourceContentItem, contentItemToUpdate } =
      await getContentItemToUpdate({
        locale,
        dcManagement,
        unique_identifier,
        loadProgress,
        dispatch,
      });

    setProgressStage(loadProgress, 2, 'Applying translations...', 1, dispatch);
    setProgress(
      loadProgress,
      0,
      'Deep apply (this may take a while)',
      dispatch
    );

    await deepApply({
      sourceContentItem,
      contentItemToUpdate,
      dcManagement,
      translatedTask,
      source_locale,
      locale,
      loadProgress,
      dispatch,
    });

    setProgressStage(loadProgress, 3, 'Updating status...', 3, dispatch);
    setProgress(loadProgress, 0, 'Updating task metadata.', dispatch);

    await Api.updateTaskMetadata(task_id, selectedProject, {
      localizedId: contentItemToUpdate && contentItemToUpdate.id,
    });

    setProgress(loadProgress, 1, 'Updating workflow state.', dispatch);

    if (params.statuses && params.statuses.translated) {
      await sourceContentItem.related.assignWorkflowState(
        new WorkflowState({ id: params.statuses.translated })
      );
    }

    setProgress(loadProgress, 2, 'Confirming task completion.', dispatch);
    await Api.confirmDownload(task_id, selectedProject);
    setDialogLoader(undefined);

    return false;
  } catch (e: any) {
    setProgressError(loadProgress, e, dispatch);
    dispatch(setError(e.message));
    return Api.errorTask(task_id, selectedProject, e.message);
  }
};

export const downloadTask =
  ({
    name,
    task_id,
    unique_identifier,
    source_locale,
    target_locale: { locale },
  }: any) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const loadProgress = createProgress(`Applying task ${name}...`, 4);
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
          loadProgress,
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
