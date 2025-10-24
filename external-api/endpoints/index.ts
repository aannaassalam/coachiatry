export const baseUrl = process.env.NEXT_APP_BASE_URL;
export const baseUrlApi = `${process.env.NEXT_APP_BASE_URL}/api/v1`;
export const baseUrlMedia = process.env.NEXT_APP_BASE_URL;

// api doc => https://militarymoves-admin.dedicateddevelopers.us/apidoc

export const mediaUrl = (url: string) => {
  return `${baseUrlMedia}/${url}`;
};

export const endpoints = {
  common: {
    search: "/search"
  },
  auth: {
    signup: "/auth/signup",
    login: "/auth/login",
    googleAuth: "/auth/google-auth",
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
  transcriptions: {
    getAllTranscriptions: "/transcriptions",
    getTranscription: (id: string) => `/transcriptions/${id}`,
    deleteTranscription: (id: string) => `/transcriptions/${id}`
  },
  task: {
    getAll: "/task",
    post: "/task",
    importBulkTasks: "/task/import-bulk-tasks",
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
    userByIds: "/user/user-by-ids",
    shared: (shareId: string) => `/user/share/${shareId}`,
    revokeAccess: (viewerId: string) => `/user/share/${viewerId}`
  },
  chat: {
    getConversations: "/chat",
    getConversation: (roomId: string) => `/chat/${roomId}`,
    createGroup: "/chat/group",
    editGroup: "/chat/group/edit"
  },
  messages: {
    getScheduleMessages: "/message/schedule",
    scheduleMessage: "/message/schedule",
    editScheduleMessage: (messageId: string) =>
      `/message/schedule/${messageId}`,
    getMessages: (room: string) => `/message/${room}`
  },
  ai: {
    chatWithAi: "/ai"
  },
  coach: {
    getClients: "/coach/clients"
  }
};
