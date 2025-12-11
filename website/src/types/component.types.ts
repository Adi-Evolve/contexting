import React from 'react'

export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LayoutProps extends ComponentProps {
  showHeader?: boolean
  showFooter?: boolean
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export interface CardProps extends ComponentProps {
  title?: string
  description?: string
  footer?: React.ReactNode
}
