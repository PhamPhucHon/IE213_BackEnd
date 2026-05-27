export default function AdminLoading() {
  return (
    <main className="container-page py-8 sm:py-10">
      <div className="h-24 rounded-md bg-surface" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-lg bg-surface" />
        ))}
      </div>
      <div className="mt-6 h-96 rounded-lg bg-surface" />
    </main>
  );
}
