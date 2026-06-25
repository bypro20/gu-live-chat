export type AdminPaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function parseAdminListQuery(
  searchParams: URLSearchParams,
  defaults: { pageSize?: number } = {},
) {
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const defaultSize = defaults.pageSize ?? 25
  const pageSize = Math.min(
    100,
    Math.max(10, Number.parseInt(searchParams.get('pageSize') || String(defaultSize), 10) || defaultSize),
  )
  const search = searchParams.get('search')?.trim() || undefined

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    search,
  }
}

export function buildAdminPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): AdminPaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
