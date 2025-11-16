import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  barClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', barClassName, value = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`}
        {...props}
      >
        <div
          className={barClassName || "h-full bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400 transition-all duration-500 ease-out shadow-sm"}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
