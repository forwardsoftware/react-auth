import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { authClient } from '@/src/auth';

// REQUEST

export async function requestSuccessInterceptor<D>(
  axiosRequestCfg: InternalAxiosRequestConfig<D>
) {
  try {
    // Get current tokens and refresh if needed
    const currentTokens = await authClient.onInit();
    const refreshedTokens = await authClient.onRefresh(currentTokens || {});

    // Set token inside provided request
    if (axiosRequestCfg?.headers && refreshedTokens?.access_token)
      axiosRequestCfg.headers.Authorization = `Bearer ${refreshedTokens.access_token}`;
  } catch (err) {
    // Do something with error of acquiring the token
    console.error('getAuthToken:', err);
  }

  return axiosRequestCfg;
}

export function requestErrorInterceptor(error: any) {
  // Do nothing in case of request error
  return Promise.reject(error);
}

// RESPONSE

export function responseSuccessInterceptor(axiosReponse: AxiosResponse) {
  // Do nothing with response
  return axiosReponse;
}

export function responseErrorInterceptor({ request, response, message }: any) {
  let status = -1;
  let errMsg = '';

  if (response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    status = response?.status ?? 500;
    errMsg = response?.statusText ?? 'Unknow server error';
    if (response?.data?.error instanceof Object) {
      errMsg = response?.data?.error?.message ?? errMsg;
    } else if (response?.data?.error) {
      errMsg = response?.data?.error;
    } else if (response?.data?.message) {
      // errMsg = response?.data?.message; // original: return directly the message
      errMsg = response?.data; // return entire BE error
    }
  } else if (request) {
    status = request?.status ?? 400;
    errMsg = 'Unknow client error';
  } else if (!!message) {
    // Something happened in setting up the request that triggered an Error
    errMsg = message;
  }

  return Promise.reject({
    status,
    message: errMsg,
  });
}
