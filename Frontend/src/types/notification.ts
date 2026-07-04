export type NotificationItem = {
  id: number
  userId: number
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  referenceId?: string | null
  referenceType?: string | null
}

export type NotificationQuery = {
  pageNumber?: number
  pageSize?: number
  isRead?: boolean
}

export type PagedResult<T> = {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type MarkAllReadResponse = {
  affected: number
}
