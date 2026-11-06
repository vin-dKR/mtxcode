import { useId, useLayoutEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const buttonVariants = {
  primary: 'border-accent bg-accent text-on-accent hover:brightness-110',
  secondary: 'border-line bg-raised text-ink hover:border-accent/55',
  ghost: 'border-transparent text-muted hover:bg-raised hover:text-ink',
};

export function Button({
  variant = 'secondary',
  className,
  type = 'button',
  ...props
}: ComponentPropsWithoutRef<'button'> & { variant?: keyof typeof buttonVariants }) {
  return <button type={type} className={cx('inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50', buttonVariants[variant], className)} {...props} />;
}

export function Badge({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full border border-line bg-raised px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-muted', className)} {...props} />;
}

export function Dialog({
  open, onClose, title, description, className, children,
}: {
  open: boolean;
  onClose(): void;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-dialog-autofocus]')?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className={cx('fixed inset-0 m-auto max-h-[min(88dvh,900px)] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/65', className)}>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-2xl font-bold tracking-tight">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <Button variant="ghost" aria-label="Close dialog" onClick={onClose} className="-mr-1 px-2"><X size={18} /></Button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
