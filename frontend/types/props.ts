// React component prop type definitions
import { 
  Parameters, 
  GroupedParameters, 
  Page, 
  CurrentUser, 
  ExecutionSystem, 
  JobRequest, 
  BatchRequest, 
  BatchAvgElapsedTime,
  SortOrder
} from './common';

export interface RouterProps {
  params: Record<string, string>;
  navigate: (path: string) => void;
  location: {
    pathname: string;
    search: string;
    hash: string;
    state?: any;
  };
}

export interface PaginatorProps {
  page?: Page | null;
  onClickPage: (pageNumber: number) => void;
}

export interface ParametersTableProps {
  parameters: Parameters;
  onChange?: (parameters: Parameters) => void;
}

export interface DoughnutProps {
  data: Record<string, { value: number; color: string }>;
  size?: string;
}

export interface AutoGrowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  style?: React.CSSProperties;
}

export interface BatchRequestPageProps {
  batchRequestPage: Page<BatchRequest>;
  executionSystemList: ExecutionSystem[];
  batchAvgElapsedTimeList: BatchAvgElapsedTime[];
  currentUser: CurrentUser;
  onToggleOrdering: (sorting: string) => void;
  onClickPage: (page: number) => void;
  onCancelBatchRequest: (batchRequest: BatchRequest) => void;
  onRerunConsumerPiece: (selectedBatchRequests: BatchRequest[]) => void;
  onForceOK: (selectedBatchRequests: BatchRequest[]) => void;
  onRerunBatch: (selectedBatchRequests: BatchRequest[]) => void;
  sorting: string;
  ordering: SortOrder;
  fromPipelineId?: number | null;
}

export interface JobRequestDetailProps {
  currentUser: CurrentUser;
}

export interface AlertProps {
  type: 'success' | 'info' | 'warning' | 'danger';
  text: string;
}

export interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export interface ErrorAlertProps {
  error: Error | string | null;
}

export interface RequestStatusBadgeProps {
  status: string;
}

export interface AlertCountBadgeProps {
  text: string;
}