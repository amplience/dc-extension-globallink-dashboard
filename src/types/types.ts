import { DashboardExtension } from 'dc-extensions-sdk';
import { ContentItem, ContentType, DynamicContent } from 'dc-management-sdk-js';
import { LoadProgress } from '../store/loadings/loadProgress';

export interface Option {
  label: string;
  value: string | number;
  key?: any;
  count?: number;
}

export interface FilterInt {
  contentTypes: any[];
  assignees: any[];
  repositories: string;
  text: string;
}

export interface FacetsInt {
  repositories: Option[];
  contentTypes: Option[];
  assignees: Option[];
}

export interface FilterBarInterface {
  facets: FacetsInt;
  total: number;
  max: number;
  locale: string;
  filter: FilterInt;
  setOpenBasket: (openBasket: boolean) => void;
}

export interface SubmissionFilterInt {
  state: any[];
  submitter: string;
  submission_name: string;
  is_error?: number;
  is_overdue?: number;
  is_redelivery?: number;
}

export interface FilterObject {
  state: string[];
  submitter: string;
  search_string: string;
  submission_name: string;
  is_error: number;
  is_overdue: number;
  is_redelivery: number;
  tags?: string[];
}

export interface SubmissionsFilterBarInterface {
  filterOptions: {
    state: Option[];
    submitters: Option[];
  };
  filter: SubmissionFilterInt;
}

export interface ApiInterface {
  apiKey: string;
  getTasks: (args: {
    selectedProject: string;
    selectedSubmission: number;
    pageNumber: number;
  }) => Promise<{
    current_page_number: number;
    total_result_pages_count: number;
    tasks_list: TaskInterface[];
  }>;
  getSubmissions: (
    page: number,
    filterObject?: SubmissionFilterInt
  ) => Promise<{
    current_page_number: number;
    total_result_pages_count: number;
    submission_list: SubmissionInt[];
  }>;
  cancelSubmission: (id: number, connector: string) => Promise<SubmissionInt>;
  createSubmission: (data: SubmissionInt) => Promise<SubmissionInt>;
  createNodeFile: (data: NodeFileInt) => Promise<{
    content_id: string;
  }>;
}

export interface Pagination {
  page: number;
  totalCount: number;
}

export interface ContentItemsInterface {
  data: ContentItem[];
  facets: {
    repositories: Option[];
    contentTypes: Option[];
    assignees: Option[];
  };
  filter: {
    contentTypes: string[];
    assignees: string[];
    repositories: string;
    text: string;
  };
  pagination: Pagination;
}

export interface Project {
  connector_name: string;
  connector_key: string;
  connector_type: string;
}

export interface CTInt {
  uri: string;
  translatableFields: string[];
  dependency?: boolean;
}

export interface ProjectInt {
  id: string;
  contentTypes: CTInt[];
}

export interface SelectedProjectConfigInterface {
  available_states?: { submission: string[]; job: string[]; task: string[] };
  connector_name?: string;
  connector_type?: string;
  file_types?: string[];
  is_multi_source_locale_supported?: boolean;
  is_search_enabled?: boolean;
  language_directions?: any;
  submission_options?: any;
  supported_locales?: any;
  workflows?: string[];
}

export interface ProjectStateInterface {
  data: Project[];
  selectedProject: string;
  selectedProjectConfig: SelectedProjectConfigInterface;
}

export interface StatusesInt {
  ready?: string;
  inProgress?: string;
  translated?: string;
}

export interface ParamsInt {
  apiKey: string;
  apiUrl: string;
  hubId: string;
  statuses?: StatusesInt;
  projects: ProjectInt[];
  dueDate: number;
  fileType: string;
  maxContentInSubmission: number;
  templates: any;
  vse: string;
  globalFilter?: string;
}

export interface SDKInterface {
  connected: boolean;
  SDK?: DashboardExtension;
  dcManagement?: DynamicContent;
  params: ParamsInt;
}

export interface LoadingsInterface {
  content: boolean;
  table: boolean;
  dialog: LoadProgress | undefined;
  loadingIds: { [key: string]: boolean };
}

export interface SubmissionInt {
  attributes?: any;
  config?: any;
  connector_key?: string;
  created_at?: number;
  creator?: string;
  due_date?: number;
  is_cancelled?: boolean;
  is_error?: number;
  is_overdue?: number;
  is_redelivery?: number;
  language_jobs?: any;
  pd_submission_id?: any;
  workflow?: string;
  content_list_locale?: any;
  source_locale?: any;
  state?: { state_name: string; last_updated: number };
  submission_id?: number;
  submission_name?: string;
  instructions?: string;
  content_list?: string[];
  submitter?: string;
  target_locale?: string;
  tags?: any;
}

export interface NodeFileInt {
  file: Blob;
  unique_identifier: string;
  public_preview_url: string;
  name: string;
  submitter: string;
  source_locale: string;
  file_type: string;
  connector_key: string;
}

export interface SubmissionsInterface {
  data: SubmissionInt[];
  selectedSubmission: SubmissionInt;
  pagination: Pagination;
  filter: SubmissionFilterInt;
}

export interface TaskInterface {
  confirm_cancel: number;
  content_id: string;
  due_date: number;
  error_message: string;
  file_type: string;
  is_cancelled: boolean;
  is_error: number;
  job_id: number;
  last_updated: number;
  metadata: any;
  name: string;
  path: string;
  pd_submission_id: string[];
  sequence_number: number;
  source_locale: { locale: string; locale_display_name: string };
  state: { state_name: string; last_updated: number };
  status: string;
  submission_id: number;
  submission_name: string;
  target_locale: { locale: string; locale_display_name: string };
  task_id: number;
  unique_identifier: string;
}

export interface TasksInterface {
  data: TaskInterface[];
  pagination: Pagination;
}

export interface UserInterface {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
}

export interface RootStateInt {
  contentItems: ContentItemsInterface;
  projects: ProjectStateInterface;
  users: { data: UserInterface[] };
  contentTypes: { data: ContentType[] };
  sdk: SDKInterface;
  error: string;
  submissions: SubmissionsInterface;
  tasks: TasksInterface;
  loadings: LoadingsInterface;
  Api: ApiInterface;
}
