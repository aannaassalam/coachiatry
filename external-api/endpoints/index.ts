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
    delete: (documentId: string) => `/documents/${documentId}`,
    shared: (shareId: string) => `/documents/share/${shareId}`
  },
  category: {
    getAll: "/categories",
    add: "/categories"
  },
  status: {
    getAll: "/statuses",
    add: "/statuses"
  },
  task: {
    getAll: "/task",
    post: "/task",
    getOne: (taskId: string) => `/task/${taskId}`,
    edit: (taskId: string) => `/task/${taskId}`,
    delete: (taskId: string) => `/task/${taskId}`,
    moveToStatus: (taskId: string) => `/task/move-to-status/${taskId}`,
    markSubtaskAsComplete: (taskId: string, subtaskId: string) =>
      `/task/completed/${taskId}/${subtaskId}`,
    shared: (shareId: string) => `/task/shared/${shareId}`
  },
  user: {
    getProfile: "/user/me",
    updateProfile: "/user/me",
    updateProfilePicture: "/user/me/update-profile-picture",
    getAllWatching: "/user/get-all-watching",
    suggestUsers: "/user/suggestions",
    addWatchers: "/user/add-watchers",
    shared: (shareId: string) => `/user/share/${shareId}`,
    revokeAccess: (viewerId: string) => `/user/share/${viewerId}`
  },
  chat: {
    getConversations: "/chat",
    getConversation: (roomId: string) => `/chat/${roomId}`
  },
  messages: {
    getMessages: (room: string) => `/message/${room}`
  }
};
