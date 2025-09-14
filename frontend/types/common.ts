// Common type definitions for the Scorch application

export interface Parameters {
  entries: Record<string, any>;
}

export interface GroupedParameters {
  groups: Record<string, Parameters>;
}

export interface Page<T = any> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

export interface CurrentUser {
  username: string;
  canRead: boolean;
  canExecute: boolean;
  canWrite?: boolean;
}

export interface ExecutionSystem {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
}

export interface JobRequest {
  id: string;
  name: string;
  jobId: string;
  username: string;
  location: string;
  status: string;
  stage: string;
  createTime: string;
  startTime?: string;
  endTime?: string;
  jobUri?: string;
  executionSystem: ExecutionSystem;
  executionType: string;
  extraInfo: {
    entries: Record<string, string>;
  };
  batchUuid: string;
  alertCount: number;
  tradeErrorCount: number;
  outputs?: Output[];
  stageTransition?: string[];
  functionalParameters: GroupedParameters;
  technicalParameters: GroupedParameters;
  overriddenParameters: Parameters;
  resolvedParameters: Parameters;
}

export interface BatchRequest {
  id: number;
  name: string;
  uuid: string;
  status: string;
  startTime?: string;
  endTime?: string;
  username: string;
  executionSystemId: string;
  totalCount: number;
  pendingCount: number;
  ongoingCount: number;
  successCount: number;
  failureCount: number;
  runningSequence?: number;
  pipelineRequestUUID?: string;
}

export interface Output {
  name: string;
  filename: string;
  quantity?: number;
  totalBytes?: number;
}

export interface LogEntry {
  id: string;
  severity: string;
  time: string;
  message: string;
}

export interface CommandLine {
  message: string;
}

export interface BatchAvgElapsedTime {
  name: string;
  avgElapsedTime: number;
  nowTime: string;
}

export interface AppInfo {
  envName: string;
  [key: string]: any;
}

export type SortOrder = 'asc' | 'desc';
export type JobRequestStatus = 'PENDING' | 'ONGOING' | 'SUCCESS' | 'FAILURE' | 'SUBMITTED' | 'RUNNING';
export type BatchRequestStatus = 'PENDING' | 'ONGOING' | 'SUCCESS' | 'FAILURE' | 'FAILED_IGNORE';