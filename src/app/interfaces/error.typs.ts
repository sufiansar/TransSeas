export interface TErrorSources {
  path: string;
  message: string;
}

export interface IGenericError {
  StatusCodes: number;
  message: string;
  errorSources?: TErrorSources[];
}
