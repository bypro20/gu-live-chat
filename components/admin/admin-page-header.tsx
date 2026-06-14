interface AdminPageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold admin-text tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm admin-text-muted mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
