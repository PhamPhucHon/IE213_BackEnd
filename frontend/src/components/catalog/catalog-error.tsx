import { StatusAlert } from "@/components/ui/status-alert";

type CatalogErrorProps = {
  title?: string;
  message: string;
};

export function CatalogError({ title = "Cannot load catalog", message }: CatalogErrorProps) {
  return (
    <StatusAlert tone="error" title={title} className="p-5">
      <p>{message}</p>
    </StatusAlert>
  );
}
