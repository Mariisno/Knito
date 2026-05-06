import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "./utils"
import { useDesignVersion } from "../../contexts/DesignVersionContext"

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'soft'
  | 'secondary'
  | 'destructive-soft'

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const v1Styles = (variant: ButtonVariant, size: ButtonSize) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

  const variants: Record<ButtonVariant, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
    outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    // v1 fallbacks for v2-only variants so the API still works on v1
    soft: 'bg-accent text-accent-foreground hover:bg-accent/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    'destructive-soft': 'bg-destructive/10 text-destructive hover:bg-destructive/15',
  }

  const sizes: Record<ButtonSize, string> = {
    default: 'h-10 py-2 px-4',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6',
    icon: 'h-10 w-10',
  }

  return `${baseStyles} ${variants[variant]} ${sizes[size]}`
}

const v2Styles = (variant: ButtonVariant, size: ButtonSize) => {
  const baseStyles = [
    'relative inline-flex items-center justify-center gap-2',
    'rounded-xl font-medium',
    'transition-[background-color,color,border-color,transform,box-shadow] duration-150',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-50 disabled:pointer-events-none',
    'select-none',
  ].join(' ')

  const variants: Record<ButtonVariant, string> = {
    default:
      'bg-primary text-primary-foreground hover:bg-primary/92 shadow-[0_1px_2px_rgba(45,37,32,0.08),0_4px_12px_-4px_rgba(217,119,87,0.35)] hover:shadow-[0_2px_4px_rgba(45,37,32,0.10),0_8px_18px_-4px_rgba(217,119,87,0.45)]',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/92 shadow-[0_1px_2px_rgba(45,37,32,0.08),0_4px_12px_-4px_rgba(220,38,38,0.35)]',
    outline:
      'border border-border bg-card hover:bg-accent hover:border-primary/30 text-foreground',
    ghost:
      'text-foreground hover:bg-accent hover:text-accent-foreground',
    soft:
      'bg-primary/10 text-primary hover:bg-primary/15',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/85',
    'destructive-soft':
      'bg-destructive/10 text-destructive hover:bg-destructive/15',
  }

  const sizes: Record<ButtonSize, string> = {
    default: 'h-11 px-5 text-[0.95rem]',
    sm: 'h-9 px-3.5 text-sm',
    lg: 'h-13 px-7 text-base',
    icon: 'h-11 w-11',
  }

  return `${baseStyles} ${variants[variant]} ${sizes[size]}`
}

const buttonVariants = (props: { variant?: ButtonVariant; size?: ButtonSize; version?: 'v1' | 'v2' }) => {
  const variant = props.variant || 'default'
  const size = props.size || 'default'
  return props.version === 'v2' ? v2Styles(variant, size) : v1Styles(variant, size)
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    const { version } = useDesignVersion()
    const isV2 = version === 'v2'
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(buttonVariants({ variant, size, version }), className)}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2
            className={cn(
              'animate-spin',
              size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
              isV2 ? '' : 'mr-2'
            )}
          />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
