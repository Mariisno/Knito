import * as React from "react"
import { X } from 'lucide-react'
import { useDesignVersion } from "../../contexts/DesignVersionContext"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContextValue {
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

const Dialog = ({ open = false, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  hideClose?: boolean
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = '', children, hideClose = false, ...props }, ref) => {
    const context = React.useContext(DialogContext)
    const { version } = useDesignVersion()

    if (!context?.open) return null

    if (version === 'v2') {
      return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center knito-dialog-root">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm knito-dialog-backdrop"
            onClick={() => context.onOpenChange?.(false)}
          />
          <div
            ref={ref}
            className={
              `relative z-50 bg-card border border-border shadow-2xl ` +
              `w-full sm:max-w-lg sm:mx-4 max-h-[92dvh] overflow-y-auto overscroll-contain ` +
              `rounded-t-2xl sm:rounded-2xl p-6 ` +
              `pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:pb-6 ` +
              `knito-dialog-content ` +
              className
            }
            {...props}
          >
            <div
              aria-hidden
              className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-border"
            />
            {!hideClose && (
              <button
                type="button"
                onClick={() => context.onOpenChange?.(false)}
                aria-label="Lukk"
                className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {children}
          </div>
          <style>{knitoDialogStyles}</style>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => context.onOpenChange?.(false)}
        />
        <div
          ref={ref}
          className={`relative z-50 bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90dvh] overflow-y-auto overscroll-contain ${className}`}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { version } = useDesignVersion()
  if (version === 'v2') {
    return (
      <div
        className={`flex flex-col space-y-2 text-left mb-5 pr-8 ${className}`}
        {...props}
      />
    )
  }
  return (
    <div
      className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`}
      {...props}
    />
  )
}
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { version } = useDesignVersion()
  if (version === 'v2') {
    return (
      <div
        className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-4 border-t border-border/60 ${className}`}
        {...props}
      />
    )
  }
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 ${className}`}
      {...props}
    />
  )
}
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', style, ...props }, ref) => {
  const { version } = useDesignVersion()
  if (version === 'v2') {
    return (
      <h2
        ref={ref}
        className={`text-card-foreground text-xl leading-tight ${className}`}
        style={{ fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '-0.01em', ...style }}
        {...props}
      />
    )
  }
  return (
    <h2
      ref={ref}
      className={`text-card-foreground ${className}`}
      style={style}
      {...props}
    />
  )
})
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => {
  const { version } = useDesignVersion()
  if (version === 'v2') {
    return (
      <p
        ref={ref}
        className={`text-sm text-muted-foreground leading-relaxed ${className}`}
        {...props}
      />
    )
  }
  return (
    <p
      ref={ref}
      className={`text-muted-foreground ${className}`}
      {...props}
    />
  )
})
DialogDescription.displayName = "DialogDescription"

interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

const DialogTrigger = ({ asChild = false, children }: DialogTriggerProps) => {
  const context = React.useContext(DialogContext)

  if (!context) {
    throw new Error('DialogTrigger must be used within a Dialog')
  }

  const handleClick = () => {
    context.onOpenChange?.(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any)
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  )
}
DialogTrigger.displayName = "DialogTrigger"

const knitoDialogStyles = `
@keyframes knito-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes knito-scale-in { from { opacity: 0; transform: scale(0.96) translateY(4px) } to { opacity: 1; transform: scale(1) translateY(0) } }
@keyframes knito-slide-up { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
.knito-dialog-backdrop { animation: knito-fade-in 160ms ease-out }
.knito-dialog-content { animation: knito-slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1) }
@media (min-width: 640px) {
  .knito-dialog-content { animation: knito-scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1) }
}
@media (prefers-reduced-motion: reduce) {
  .knito-dialog-backdrop, .knito-dialog-content { animation: none }
}
`

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger }
