export default function PanelLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06060f]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        <p className="text-sm text-zinc-500">Panel yükleniyor...</p>
      </div>
    </div>
  );
}
