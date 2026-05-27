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
      className="group overflow-hidden rounded-lg border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="relative aspect-[5/3] bg-surface">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-muted">
            {category.name}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-ink">{category.name}</h3>
        {category.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{category.description}</p>
        ) : null}
      </div>
    </Link>
  );
}
