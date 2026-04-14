import type { ReactNode } from "react";
import Link from "next/link";

export function LegalDocument(props: {
  title: string;
  updated: string;
  /** Блок над ссылкой «назад» (например хлебные крошки). */
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {props.lead ? <div className="mb-4">{props.lead}</div> : null}
      <p className="text-sm text-neutral-500">
        <Link href="/legal" className="text-primary underline-offset-4 hover:underline">
          ← Юридическая информация
        </Link>
      </p>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        {props.title}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Редакция от {props.updated}</p>
      <div className="mt-8 max-w-none space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 [&_a]:text-primary [&_h2]:mt-8 [&_h2]:scroll-mt-24 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_h2]:first:mt-0 dark:[&_h2]:text-neutral-100 [&_li]:mt-1 [&_p]:first:mt-0 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {props.children}
      </div>
    </article>
  );
}
