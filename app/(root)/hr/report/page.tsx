export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-primary-container">construction</span>
      </div>
      <h1 className="text-4xl font-h1 font-bold text-on-background mb-4">Coming Soon</h1>
      <p className="text-on-surface-variant font-body-md text-center">
        We are currently building this module. It will be available shortly!
      </p>
    </div>
  );
}
