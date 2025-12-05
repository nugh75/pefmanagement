'use client'

import React from 'react'

interface BreadcrumbProps {
  children: React.ReactNode
  className?: string
}

export function Breadcrumb({ children, className }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={className}>
      {children}
    </nav>
  )
}

export function BreadcrumbList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="flex items-center gap-1.5 text-sm">
      {children}
    </ol>
  )
}

export function BreadcrumbItem({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center gap-1.5">{children}</li>
}

export function BreadcrumbLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

export function BreadcrumbPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <span className={className}>{children}</span>
}

export function BreadcrumbSeparator() {
  return <span className="text-slate-300">/</span>
}
