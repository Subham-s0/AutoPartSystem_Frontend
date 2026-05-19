import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export interface PageMeta {
  title: string
  subtitle: string
}
