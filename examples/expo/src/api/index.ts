import { BASE_URL } from '@/src/constants';
import axios from 'axios';
import {
  requestErrorInterceptor,
  requestSuccessInterceptor,
  responseErrorInterceptor,
  responseSuccessInterceptor,
} from './interceptors';

// AXIOS
// use this APIClient to make service calls
export const APIClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set request interceptor to add Auth token
APIClient.interceptors.request.use(
  requestSuccessInterceptor,
  requestErrorInterceptor
);

APIClient.interceptors.response.use(
  responseSuccessInterceptor,
  responseErrorInterceptor
);
