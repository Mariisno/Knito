import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-11 w-full rounded-lg border border-border bg-input-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
