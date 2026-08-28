import type { ButtonHTMLAttributes } from 'react'
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' }
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) { return <button className={`button button-${variant} ${className}`} {...props} /> }
