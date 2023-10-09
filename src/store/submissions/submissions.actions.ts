/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Dispatch } from 'redux';
import jsonpath from 'jsonpath';
import {
  ContentType,
  WorkflowState,
  ContentGraph,
  ContentLink,
  ContentItem,
} from 'dc-management-sdk-js';
import { setError } from '../error/error.actions';
import { AppDispatch, RootState } from '../store';
import { history } from '../../App';
import {
  setTasks,
  setPagination as setTasksPagination,
} from '../tasks/tasks.actions';
import {
  setContentLoader,
  setDialogLoader,
} from '../loadings/loadings.actions';
import {
  Pagination,
  RootStateInt,
  SubmissionFilterInt,
  SubmissionInt,
  FilterObject,
} from '../../types/types';
import {
  createProgressContext,
  createProgressList,
  freeProgressContext,
  parallelProcess,
  setProgress,
  setProgressError,
  setProgressStage,
} from '../loadings/loadProgress';
import { deepCopy } from '../../utils/ContentDependencyTree';

export const SET_SUBMISSIONS = 'SET_SUBMISSIONS';
export const SET_SELECTED_SUBMISSION = 'SET_SELECTED_SUBMISSION';
export const SET_PAGINATION = 'SET_PAGINATION';
export const CHANGE_SUB_PAGE = 'CHANGE_SUB_PAGE';
export const SET_SUB_FILTER = 'SET_SUB_FILTER';

export const setSubmissions = (value: SubmissionInt[]) => ({
  type: SET_SUBMISSIONS,
  value,
});

export const setFilter = (value: SubmissionFilterInt) => ({
  type: SET_SUB_FILTER,
  value,
});

export const setSelectedSubmission =
  (value?: SubmissionInt) => (dispatch: Dispatch) => {
    try {
      dispatch({
        type: SET_SELECTED_SUBMISSION,
        value,
      });

      dispatch(setTasks([]));
      dispatch(
        setTasksPagination({
          page: 0,
          totalCount: 0,
        })
      );

      history.push('/tasks');
    } catch (e: any) {
      dispatch(setError(e.toString()));
    }
  };

export const setPagination = (value: Pagination) => ({
  type: SET_PAGINATION,
  value,
});

export const getSubmissions =
  (page?: number, filter?: SubmissionFilterInt) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      let filterObject: FilterObject = {
        state: [],
        submitter: '',
        search_string: '',
        submission_name: '',
        is_error: 0,
        is_overdue: 0,
        is_redelivery: 0,
      };
      const {
        Api,
        sdk: {
          params: { globalFilter },
        },
        submissions: {
          filter: storedFilter,
          pagination: { page: currentPage },
        },
      }: RootStateInt = getState();

      dispatch(setContentLoader(true));

      if (filter || storedFilter) {
        const currentFilter: any = filter || storedFilter;
        filterObject = Object.keys(currentFilter).reduce(
          (acc: { [key: string]: any }, key: string) => {
            if (key !== 'state' && currentFilter[key]) {
              acc[key] = currentFilter[key];
            } else if (
              key === 'state' &&
              currentFilter[key] &&
              currentFilter[key].length
            ) {
              acc[key] = currentFilter[key];
            }

            return acc;
          },
          {}
        ) as FilterObject;
      }

      if (globalFilter) {
        filterObject.tags = [globalFilter];
      }

      const { current_page_number, total_result_pages_count, submission_list } =
        await Api.getSubmissions(page || currentPage || 0, filterObject);

      dispatch(setSubmissions(submission_list));
      dispatch(
        setPagination({
          page: current_page_number,
          totalCount: total_result_pages_count,
        })
      );
      dispatch(setContentLoader(false));
    } catch (e: any) {
      dispatch(setError(e.toString()));
      dispatch(setContentLoader(false));
    }
  };

export const cancelSubmission =
  ({ submission_id }: SubmissionInt) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const { Api, projects }: RootStateInt = getState();

      dispatch(setContentLoader(true));

      if (submission_id) {
        await Api.cancelSubmission(submission_id, projects.selectedProject);
      }

      dispatch(setContentLoader(false));
    } catch (e: any) {
      dispatch(setError(e.toString()));
      dispatch(setContentLoader(false));
    }
  };

export const createSubmission =
  ({
    submitter,
    contentItems,
    name,
    workflow,
    dueDate,
    additionalInstructions,
    sourceLocale,
    targetLocales,
    additional,
    config,
  }: {
    submitter: string;
    contentItems: string[];
    name: string;
    workflow: string;
    dueDate: number;
    additionalInstructions: string;
    sourceLocale: string;
    targetLocales: string;
    additional: { [key: string]: any };
    config: { [key: string]: any };
  }) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const progress = createProgressList(1, 1);
    const loadContext = createProgressContext(
      progress,
      'Creating Submission...',
      3,
      dispatch
    );
    let threadedPart = false;

    try {
      const {
        Api,
        projects: { selectedProject },
        contentTypes: { data: hubContentTypes },
        sdk: { params, dcManagement },
      }: RootStateInt = getState();
      if (!dcManagement) {
        return dispatch(setError('No DC Management SDK found'));
      }
      const project = params.projects.find(
        (el: any) => el.id === selectedProject
      );

      setProgressStage(
        loadContext,
        0,
        'Scanning content...',
        contentItems.length
      );

      const idMappingTable: { [key: string]: any } = {};
      const tasks: string[] = [];

      // Becomes multithreaded here.
      const threadedProgress = createProgressList(
        contentItems.length,
        3,
        'Creating Submission...',
        progress.startTime
      );
      threadedPart = true;

      await parallelProcess(contentItems, 3, async (contentItemId, index) => {
        idMappingTable[contentItemId] = {
          nested: {},
        };

        const loadContext = createProgressContext(
          threadedProgress,
          `Submitting ${contentItemId} (${index + 1}/${contentItems.length})`,
          1,
          dispatch
        );

        setProgressStage(loadContext, 0, `Processing: ${contentItemId}`, 2);
        setProgress(loadContext, 0, `Scanning...`);

        try {
          await deepCopy(
            [contentItemId],
            dcManagement.contentItems.get,
            async (contentItem) => {
              setProgress(
                loadContext,
                0,
                `Scanning: ${contentItem?.id ?? contentItemId}`
              );

              const contentType =
                contentItem &&
                project &&
                project.contentTypes.find(
                  ({ uri }: { uri: string }) =>
                    uri === contentItem.body._meta.schema
                );

              if (contentItemId === contentItem.id) {
                const ct =
                  hubContentTypes &&
                  hubContentTypes.find(
                    ({ contentTypeUri }: ContentType) =>
                      contentType &&
                      contentTypeUri &&
                      contentType.uri &&
                      contentTypeUri.toLowerCase() ===
                        contentType.uri.toLowerCase()
                  );
                const defaultVizObject =
                  ct && ct.settings && ct.settings.visualizations
                    ? ct.settings.visualizations.find((viz) => viz.default)
                    : { templatedUri: '' };

                const defaultViz =
                  defaultVizObject && defaultVizObject.templatedUri
                    ? defaultVizObject.templatedUri
                        .replace(/{{vse.domain}}/g, params.vse)
                        .replace(/{{content.sys.id}}/g, contentItem.id)
                    : '';
                idMappingTable[contentItemId].label = contentItem.label;
                idMappingTable[contentItemId].contextUrl = defaultViz || '';
              }

              if (contentType && contentType.translatableFields) {
                const fileJson = contentType.translatableFields.reduce(
                  (acc: any, field: string) => {
                    const nodes = jsonpath.nodes(
                      contentItem.body,
                      `$.${field}`
                    );

                    nodes.forEach(({ path, value }) => {
                      if (value && !ContentLink.isContentLink(value)) {
                        acc.push({
                          key: path.join('.').replace('$.', ''),
                          value,
                        });
                      }
                    });

                    return acc;
                  },
                  []
                );

                if (contentItemId === contentItem.id) {
                  idMappingTable[contentItemId].translations = fileJson;
                } else if (sourceLocale === contentItem.locale) {
                  idMappingTable[contentItemId].nested[contentItem.id] =
                    fileJson;
                }
              }

              return contentItem;
            }
          );

          setProgress(loadContext, 1, `Uploading for translation...`);

          const objJsonStr = JSON.stringify(idMappingTable[contentItemId]);

          const { content_id } = await Api.createNodeFile({
            file: new Blob([objJsonStr], {
              type: 'application/json',
            }),
            unique_identifier: contentItemId,
            public_preview_url: idMappingTable[contentItemId].contextUrl,
            name: idMappingTable[contentItemId].label,
            submitter,
            source_locale: sourceLocale,
            file_type: params.fileType || 'json',
            connector_key: selectedProject || '',
          });

          tasks.push(content_id);
        } catch (e) {
          setProgressError(loadContext, e);

          throw e;
        }

        freeProgressContext(loadContext);
      });

      threadedPart = false;

      setProgressStage(loadContext, 1, 'Creating submission...', 1);

      const submissionData: SubmissionInt = {
        submission_name: name,
        due_date: dueDate && new Date(dueDate).getTime(),
        instructions: additionalInstructions || '',
        source_locale: sourceLocale,
        target_locale: targetLocales,
        content_list: tasks,
        content_list_locale: tasks.map((id: any) => ({
          content_id: id,
          target_locale: targetLocales,
        })),
        submitter: submitter,
        workflow: workflow,
        connector_key: selectedProject || '',
      };

      if (params.globalFilter) {
        submissionData.tags = [params.globalFilter];
      }

      if (Object.keys(additional).length) {
        submissionData.attributes = additional;
      }

      if (Object.keys(config).length) {
        submissionData.config = config;
      }

      await Api.createSubmission(submissionData);

      setProgressStage(
        loadContext,
        2,
        'Assigning workflow states...',
        contentItems.length
      );

      let completeCount = 0;

      setProgress(loadContext, 0, 'Assigning states...');

      await Promise.all(
        contentItems.map(async (id: string) => {
          const contentItem: ContentItem = await dcManagement.contentItems.get(
            id
          );

          if (params.statuses && params.statuses.inProgress) {
            await contentItem.related.assignWorkflowState(
              new WorkflowState({ id: params.statuses.inProgress })
            );
          }

          setProgress(loadContext, ++completeCount, 'Assigning states...');

          return contentItem;
        })
      );

      dispatch(getSubmissions(0));

      history.push('/');
      return dispatch(setDialogLoader(undefined));
    } catch (e: any) {
      if (!threadedPart) {
        setProgressError(loadContext, e);
      }

      return dispatch(setError(e.toString()));
    }
  };
