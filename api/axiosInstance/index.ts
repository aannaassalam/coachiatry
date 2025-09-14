import axios from "axios";
import { parseCookies } from "nookies";
import { baseUrlApi } from "../endpoints";
import { getSession } from "next-auth/react";
// import { refreshAccessToken } from "../functions/user.api";

const axiosInstance = axios.create({
  baseURL: baseUrlApi
});

axiosInstance.interceptors.request.use(async (config) => {
  const session = await getSession();

  if (session?.token && !!config.headers) {
    config.headers["Authorization"] = `Bearer ${session?.token}`;
  }

  return config;
});

export default axiosInstance;
