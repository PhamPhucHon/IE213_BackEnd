type CatalogErrorProps = {
  title?: string;
  message: string;
};

export function CatalogError({ title = "Catalog unavailable", message }: CatalogErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </div>
  );
}
