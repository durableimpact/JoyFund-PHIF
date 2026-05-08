export default function CTASection() {
  return (
    <section id="start" className="relative py-32 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1600&auto=format&fit=crop')",
        }}
      />
      {/* Blue gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700/90 via-blue-600/85 to-blue-500/80" />

      {/* Decorative circles */}
      <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
          Start A JoyFund Today
        </h2>
        
        <p className="text-blue-100 mb-10 leading-relaxed text-sm md:text-base max-w-lg mx-auto">
          Use this space to show JoyFunds statistics so far; for example show
          the number of lives changed, the amount of money raised on the
          platform etc.
        </p>
        <a
          href="#"
          className="inline-block bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl text-sm md:text-base"
        >
          start a JoyFund
        </a>
      </div>
    </section>
  );
}
