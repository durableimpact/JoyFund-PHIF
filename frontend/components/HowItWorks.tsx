export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              How it works
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8 text-base md:text-lg">
              This is the space to introduce visitors to the business or brand.
              Briefly explain who is behind it, what it does and what makes it
              unique. Share its core values and what this site has to offer.
            </p>
            <a
              href="#learn-more"
              className="inline-block border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-7 py-3 rounded-full transition-all duration-200 text-sm"
            >
              Learn more
            </a>
          </div>

          {/* Right: Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              {/* <img
                src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop"
                alt="Children smiling"
                className="w-full h-full object-cover"
              /> */}
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop"
                alt="Children smiling"
                className="w-full h-full object-cover"
                // className="w-full h-full object-cover grayscale"
              />
            </div>
            {/* Decorative accent */}
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-100 rounded-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
