import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

export const buttonStyles = cva(
  [
    'press relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium',
    'transition-[transform,background-color,box-shadow,color,opacity] duration-150 ease-out',
    'disabled:opacity-45 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-ink text-white shadow-ink hover:bg-ink-hover',
        secondary: 'bg-surface text-fg shadow-button hover:bg-sunken',
        ghost: 'text-fg-2 hover:bg-black/[0.045] hover:text-fg',
        accent: 'bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.15)] hover:brightness-105',
        danger: 'bg-surface text-danger shadow-button hover:bg-danger-soft',
      },
      size: {
        sm: 'h-8 rounded-[10px] px-3 text-sm',
        md: 'h-10 rounded-[12px] px-4 text-base',
        lg: 'h-12 rounded-[14px] px-5 text-md',
        icon: 'size-9 rounded-[10px]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />
})
