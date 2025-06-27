import * as React from "react";
import clsx from "clsx";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}

/**
 * Skeleton loading placeholder for content.
 *
 * @example
 * <Skeleton width={100} height={20} />
 */
export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 20, radius = 4, className, ...props }) => (
  <div
    className={clsx(
      "bg-gray-200 animate-pulse",
      className
    )}
    style={{ width, height, borderRadius: radius }}
    {...props}
  />
);
Skeleton.displayName = "Skeleton";
