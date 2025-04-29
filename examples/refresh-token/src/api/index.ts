import axios from "axios";
import {
  requestSuccessInterceptor,
  requestErrorInterceptor,
  responseSuccessInterceptor,
  responseErrorInterceptor,
} from "./interceptors";

// AXIOS
// use this APIClient to make service calls
export const APIClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Set request interceptor to add Auth token
APIClient.interceptors.request.use(requestSuccessInterceptor, requestErrorInterceptor);

APIClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);
