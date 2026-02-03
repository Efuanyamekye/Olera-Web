import type { ReactNode } from "react";

interface FormFieldProps {
  children: ReactNode;
}

/**
 * Wraps form inputs with consistent vertical spacing.
 * Use inside a <form> to maintain uniform gaps between fields.
 */
export default function FormField({ children }: FormFieldProps) {
  return <div className="space-y-4">{children}</div>;
}

interface FormActionsProps {
  children: ReactNode;
}

/**
 * Container for form submit/cancel buttons with consistent spacing.
 */
export function FormActions({ children }: FormActionsProps) {
  return <div className="flex gap-3 pt-2">{children}</div>;
}
