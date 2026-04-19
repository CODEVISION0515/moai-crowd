import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    href: string;
    label: string;
  };
  children?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  children,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`} role="status">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <p className="empty-state-title">{title}</p>
      {description ? <p className="empty-state-desc mt-1">{description}</p> : null}
      {action ? (
        <Link href={action.href} className="btn-accent mt-4">
          {action.label}
        </Link>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
