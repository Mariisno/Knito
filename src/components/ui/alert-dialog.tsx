import * as React from "react"
import { AlertTriangle } from 'lucide-react'
import { Button } from "./button"
import { useDesignVersion } from "../../contexts/DesignVersionContext"

type AlertDialogTone = 'default' | 'danger'

interface AlertDialogContextValue {
  close: () => void
  tone: AlertDialogTone
}

const AlertDialogContext = React.createContext<AlertDialogContextValue>({
  close: () => {},
  tone: 'default',
})

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  tone?: AlertDialogTone
  children: React.ReactNode
}

const AlertDialog = ({ open, onOpenChange, tone = 'default', children }: AlertDialogProps) => {
  const close = () => onOpenChange?.(false)
  const { version } = useDesignVersion()

  if (!open) return null

  if (version === 'v2') {
    return (
      <AlertDialogContext.Provider value={{ close, tone }}>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center knito-dialog-root">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm knito-dialog-backdrop"
            onClick={close}
          />
          <div className="relative z-50 w-full sm:max-w-lg sm:mx-4 knito-dialog-content">
            {children}
          </div>
          <style>{knitoAlertStyles}</style>
        </div>
      </AlertDialogContext.Provider>
    )
  }

  return (
    <AlertDialogContext.Provider value={{ close, tone }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={close}
        />
        <div className="relative z-50">
          {children}
        </div>
      </div>
    </AlertDialogContext.Provider>
  )
}

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => {
  const { version } = useDesignVersion()
  const { tone } = React.useContext(AlertDialogContext)

  if (version === 'v2') {
    return (
      <div
        ref={ref}
        className={
          `relative bg-card border border-border shadow-2xl ` +
          `w-full max-h-[92dvh] overflow-y-auto overscroll-contain ` +
          `rounded-t-2xl sm:rounded-2xl p-6 ` +
          `pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:pb-6 ` +
          className
        }
        {...props}
      >
        <div
          aria-hidden
          className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-border"
        />
        {tone === 'danger' && (
          <div className="flex items-center justify-center sm:justify-start mb-4">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-destructive/12 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        )}
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`relative bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90dvh] overflow-y-auto overscroll-contain ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { version } = useDesignVersion()
  const { tone } = React.useContext(AlertDialogContext)
  if (version === 'v2') {
    return (
      <div
        className={
          `flex flex-col space-y-2 mb-5 ` +
          (tone === 'danger' ? 'text-center sm:text-left ' : 'text-left ') +
          className
        }
        {...props}
      />
    )
  }
  return (
    <div
      className={`flex flex-col space-y-2 mb-4 ${className}`}
      {...props}
    />
  )
}
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', style, ...props }, ref) => {
  const { version } = useDesignVersion()
  if (version === 'v2') {
    return (
      <h2
        ref={ref}
        className={`text-card-foreground text-lg leading-tight ${className}`}
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
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef<
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
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  )
})
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { version } = useDesignVersion()
  if (version === 'v2') {
    return (
      <div
        className={
          `flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-4 border-t border-border/60 ${className}`
        }
        {...props}
      />
    )
  }
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 ${className}`}
      {...props}
    />
  )
}
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' }
>(({ className = '', onClick, variant, ...props }, ref) => {
  const { close, tone } = React.useContext(AlertDialogContext)
  const resolvedVariant = variant ?? (tone === 'danger' ? 'destructive' : 'default')
  return (
    <Button
      ref={ref}
      variant={resolvedVariant}
      className={className}
      onClick={(e) => {
        onClick?.(e)
        close()
      }}
      {...props}
    />
  )
})
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = '', onClick, ...props }, ref) => {
  const { close } = React.useContext(AlertDialogContext)
  return (
    <Button
      ref={ref}
      variant="outline"
      className={className}
      onClick={(e) => {
        onClick?.(e)
        close()
      }}
      {...props}
    />
  )
})
AlertDialogCancel.displayName = "AlertDialogCancel"

const knitoAlertStyles = `
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

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}
