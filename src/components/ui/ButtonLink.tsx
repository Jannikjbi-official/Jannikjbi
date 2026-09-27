import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonVariants, type ButtonVariants } from "@heroui/react";

import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  fullWidth?: boolean;
  className?: string;
  external?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

/**
 * A link that looks like a HeroUI button.
 *
 * HeroUI's `Button` renders a `<button>`; navigation has to be an `<a>` to keep
 * middle-click, "open in new tab" and screen-reader semantics working. Applying
 * HeroUI's own `buttonVariants` classes keeps the styling identical to a real
 * Button without faking the element.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  external,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
