export default function ProductDetailLoading() {
  return (
    <main className="container-page py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="grid gap-3">
          <div className="aspect-[4/3] rounded-lg bg-surface" />
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-md bg-surface" />
            ))}
          </div>
        </div>
        <div className="h-[520px] rounded-lg bg-surface" />
      </div>
    </main>
  );
}
