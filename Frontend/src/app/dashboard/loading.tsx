export default function DashboardLoading() {
  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      <div className="hidden w-[440px] border-r border-border bg-surface p-8 md:block">
        <div className="h-7 w-32 rounded-full bg-background" />
        <div className="mt-8 space-y-4">
          <div className="h-14 rounded-premium bg-background" />
          <div className="h-14 rounded-premium bg-background" />
          <div className="h-12 rounded-premium bg-background" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </div>
  );
}
