import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/models";

type CategoryCardProps = {
  category: Category;
};

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="focus-ring group overflow-hidden rounded-lg border border-line bg-white shadow-subtle transition duration-200 ease-ui hover:-translate-y-0.5 hover:border-line-strong hover:shadow-soft"
    >
      <div className="relative aspect-[5/3] overflow-hidden bg-surface">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 ease-ui group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-muted">
            {category.name}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent opacity-80" />
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Collection</p>
        <h3 className="mt-1 text-base font-semibold text-ink">{category.name}</h3>
        {category.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{category.description}</p>
        ) : null}
      </div>
    </Link>
  );
}
