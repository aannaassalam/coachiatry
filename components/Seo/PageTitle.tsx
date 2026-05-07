import Head from "next/head";

const APP_NAME = "Coachiatry";

/**
 * Drop-in per-page title for the browser tab. Renders
 * `{title} · {APP_NAME}` so every tab shows the page context plus the brand.
 * Falls back to the brand alone when no title is supplied.
 */
export default function PageTitle({ title }: { title?: string }) {
  const text = title ? `${title} | ${APP_NAME}` : APP_NAME;
  return (
    <Head>
      <title>{text}</title>
    </Head>
  );
}
