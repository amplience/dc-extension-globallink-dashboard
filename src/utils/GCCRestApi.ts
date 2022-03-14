import axios, { AxiosResponse } from 'axios';
import {
  Project,
  SelectedProjectConfigInterface,
  SubmissionFilterInt,
  SubmissionInt,
  TaskInterface,
} from '../types/types';

const PAGE_SIZE = 20;

const convertToFormData = (item: any) => {
  const formData = new FormData();
  const keys = Object.keys(item);

  for (let k = keys.length - 1; k >= 0; k--) {
    const key = keys[k];
    if (item[key]) {
      formData.append(key, item[key] || '');
    }
  }

  return formData;
};

interface ApiParams {
  apiKey: string;
}

class PDRestApi {
  readonly apiKey: string;

  constructor({ apiKey }: ApiParams) {
    this.apiKey = apiKey;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    axios.defaults.headers.common['api-key'] = apiKey;
  }

  async getProjects(): Promise<Project[]> {
    return axios({
      method: 'GET',
      url: '/connector/list',
    }).then(
      ({ data }: AxiosResponse<{ response_data: Project[] }>) =>
        data?.response_data
    );
  }

  async getProjectConfig(key: string): Promise<SelectedProjectConfigInterface> {
    return axios({
      method: 'GET',
      url: `/connector/config?connector_key=${key}`,
    }).then(
      ({
        data,
      }: AxiosResponse<{ response_data: SelectedProjectConfigInterface }>) =>
        data.response_data
    );
  }

  async getSubmissions(
    pageNumber: number,
    filterObject: SubmissionFilterInt
  ): Promise<any> {
    return axios({
      method: 'POST',
      url: 'submission/list',
      data: {
        page_number: pageNumber,
        page_size: PAGE_SIZE,
        ...filterObject,
      },
    }).then(({ data }) => data.response_data);
  }

  async cancelTask(taskId: string, selectedProject: string): Promise<any> {
    return axios({
      method: 'POST',
      url: 'task/cancel',
      data: {
        task_id: taskId,
        connector_key: selectedProject,
      },
    }).then(({ data }) => data.response_data);
  }

  async errorTask(
    taskId: string,
    selectedProject: string,
    errorMessage: string
  ): Promise<any> {
    return axios({
      method: 'POST',
      url: 'task/error',
      data: {
        task_id: taskId,
        error_message: errorMessage,
        error_stacktrace: '',
        connector_key: selectedProject,
      },
    }).then(({ data }) => data.response_data);
  }

  async cancelSubmission(id: number, selectedProject: string): Promise<any> {
    return axios({
      method: 'POST',
      url: 'submission/cancel',
      data: {
        submission_id: id,
        connector_key: selectedProject,
      },
    }).then(
      ({ data }: AxiosResponse<{ response_data: SubmissionInt }>) =>
        data.response_data
    );
  }

  async getTasks({
    selectedProject,
    selectedSubmission,
    pageNumber,
  }: {
    pageNumber: number;
    selectedProject: string;
    selectedSubmission: string;
  }): Promise<TaskInterface[]> {
    return axios({
      method: 'GET',
      url: `submission/tasks?submission_id=${selectedSubmission}&connector_key=${selectedProject}&page_number=${pageNumber}&page_size=${PAGE_SIZE}`,
    }).then(
      ({ data }: AxiosResponse<{ response_data: TaskInterface[] }>) =>
        data.response_data
    );
  }

  async createSubmission(dataObj: SubmissionInt): Promise<SubmissionInt> {
    return axios({
      method: 'POST',
      url: 'content/submit',
      data: dataObj,
    }).then(
      ({ data }: AxiosResponse<{ response_data: SubmissionInt }>) =>
        data.response_data
    );
  }

  async createNode(dataObj: any): Promise<any> {
    return axios({
      method: 'POST',
      url: 'content/upload/data',
      data: convertToFormData(dataObj),
    }).then(({ data }) => data.response_data);
  }

  async createNodeFile(dataObj: any): Promise<{ content_id: string }> {
    return axios({
      method: 'POST',
      url: 'content/upload/file',
      data: convertToFormData(dataObj),
    }).then(({ data }) => data.response_data);
  }

  async downloadTask(taskId: string, selectedProject: string): Promise<any> {
    return axios({
      method: 'GET',
      url: `task/download?task_id=${taskId}&connector_key=${selectedProject}`,
    }).then(({ data }) => data);
  }

  async updateTaskMetadata(
    taskId: string,
    selectedProject: string,
    metadata: any
  ): Promise<any> {
    return axios({
      method: 'PUT',
      url: 'task/metadata',
      data: {
        task_ids: [taskId],
        task_metadata: metadata,
        connector_key: selectedProject,
      },
    }).then(({ data }) => data);
  }

  async confirmDownload(taskId: string, selectedProject: string): Promise<any> {
    return axios({
      method: 'POST',
      url: 'task/download/confirm',
      data: {
        task_id: taskId,
        connector_key: selectedProject,
      },
    }).then(({ data }) => data);
  }
}

export default PDRestApi;
