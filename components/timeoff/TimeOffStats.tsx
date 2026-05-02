export function TimeOffStats() {
  return (
    <div className="flex items-center gap-12 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm mb-6">
      <div className="text-center">
        <p className="font-h3 text-[#4DA6FF] text-lg mb-1 font-bold">Paid time Off</p>
        <p className="font-body-md text-on-surface-variant font-medium">24 Days Available</p>
      </div>
      <div className="text-center">
        <p className="font-h3 text-secondary text-lg mb-1 font-bold">Sick time off</p>
        <p className="font-body-md text-on-surface-variant font-medium">07 Days Available</p>
      </div>
    </div>
  );
}
