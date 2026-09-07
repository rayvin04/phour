import React, { type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'button--sm' : size === 'lg' ? 'button--lg' : ''
  return (
    <button
      className={`button button-${variant} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
