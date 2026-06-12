export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in space-y-8">
      <div className="h-28 rounded-2xl bg-muted/60 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/50" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl bg-muted/40" />
        <div className="h-64 rounded-2xl bg-muted/40" />
      </div>
    </div>
  )
}
