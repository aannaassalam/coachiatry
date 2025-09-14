export const baseUrl = process.env.NEXT_APP_BASE_URL;
export const baseUrlApi = `${process.env.NEXT_APP_BASE_URL}/api/v1`;
export const baseUrlMedia = process.env.NEXT_APP_BASE_URL;

// api doc => https://militarymoves-admin.dedicateddevelopers.us/apidoc

export const mediaUrl = (url: string) => {
  return `${baseUrlMedia}/${url}`;
};

export const endpoints = {
  auth: {
    signup: "/auth/signup",
    login: "/auth/login",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    updatePassword: "/auth/update-password"
  },
  document: {
    getAll: "/documents",
    add: "/documents",
    getOne: (documentId: string) => `/documents/${documentId}`,
    edit: (documentId: string) => `/documents/${documentId}`,
    delete: (documentId: string) => `/documents/${documentId}`
  },
  user: {
    getProfile: "/user/me",
    updateProfile: "/user/me"
  }
};
