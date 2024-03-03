export interface IEMAIL {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface ErrorDetail {
  // Define the structure of each error detail
  // For example:
  field: string;
  message: string;
}

export interface IApiError extends Error {
  statusCode: number;
  data: any | null;
  message: string;
  success: boolean;
  errors: ErrorDetail[];
}
