type CabinetPagePlaceholderProps = {
  title: string;
  description?: string;
};

export function CabinetPagePlaceholder({
  title,
  description = "Раздел будет подключён на следующих этапах.",
}: CabinetPagePlaceholderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}
