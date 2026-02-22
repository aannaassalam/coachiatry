import assets from "@/json/assets";

export default [
  {
    title: "main sections",
    links: [
      {
        icon: assets.icons.dashboard,
        title: "dashboard",
        href: "/"
      },
      {
        icon: assets.icons.clients,
        title: "Clients",
        href: "/clients"
      },
      {
        icon: assets.icons.task,
        title: "my tasks",
        href: "/tasks"
      },
      {
        icon: assets.icons.transcripts,
        title: "my transcripts",
        href: "/transcripts"
      },
      {
        icon: assets.icons.chat,
        title: "chat",
        href: "/chat"
      },
      {
        icon: assets.icons.documents,
        title: "my documents",
        href: "/documents"
      }
    ]
  },
  {
    title: "others",
    links: [
      {
        icon: assets.icons.settings,
        title: "settings",
        href: "/settings"
      },
      {
        icon: assets.icons.clients,
        title: "Users & permissions",
        href: "/users"
      }
    ]
  }
];
