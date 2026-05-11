import Navbar from "./Navbar";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1600&auto=format&fit=crop')",
        }}
      />

      {/* Gradient overlay: transparent at top, white at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white" />

      {/* Navbar */}
      <Navbar />

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-48">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-md leading-tight max-w-3xl">
          Celebrate Life. Give the Gift
          <br className="hidden md:block" /> of Health.
        </h1>
        <p className="mt-5 text-white/90 text-base md:text-lg max-w-xl leading-relaxed drop-shadow">
          Turn birthdays, weddings, graduations, and milestones into healthcare
          support for someone who needs it.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="#start"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl text-sm md:text-base"
          >
            start a JoyFund
          </a>
          <a
            href="#how-it-works"
            className="border-2 border-white text-white hover:bg-white hover:text-blue-700 font-semibold px-8 py-3.5 rounded-full transition-all text-sm md:text-base"
          >
            How it works
          </a>
        </div>
      </div>
    </section>
  );
}
