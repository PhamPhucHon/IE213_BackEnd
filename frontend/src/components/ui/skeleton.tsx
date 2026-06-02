import { cn } from "@/lib/utils";
import { skeletonClassName } from "./style-primitives";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn(skeletonClassName, className)} />;
}
