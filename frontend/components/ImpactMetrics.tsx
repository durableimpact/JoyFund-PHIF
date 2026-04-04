const stats = [
  { value: "30k", label: "Lives Changed" },
  { value: "+42%", label: "Year-over-Year Growth" },
  { value: "3M", label: "Dollars Raised" },
];

export default function ImpactMetrics() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800" />
      {/* Subtle decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Impact Metrics
        </h2>
        <p className="text-blue-100 max-w-2xl mx-auto mb-16 leading-relaxed text-sm md:text-base">
          Use this space to show JoyFunds statistics so far; for example show
          the number of lives changed, the amount of money raised on the
          platform etc.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`flex flex-col items-center py-8 px-6 ${
                index < stats.length - 1
                  ? "border-b md:border-b-0 md:border-r border-white/20"
                  : ""
              }`}
            >
              <span className="text-6xl md:text-7xl font-bold text-white tracking-tight">
                {stat.value}
              </span>
              <span className="mt-3 text-blue-200 text-sm md:text-base font-medium uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
