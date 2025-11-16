import * as React from "react"
import { X } from 'lucide-react'

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 ${className}`}
    {...props}
  >
    {children}
  </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-card-foreground ${className}`}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

export { Dialog, DialogContent, DialogHeader, DialogTitle }
