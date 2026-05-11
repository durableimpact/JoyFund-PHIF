import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <main>
      <Navbar />

      {/* Hero / Intro */}
      <section className="pt-20 pb-16 bg-white text-center px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            About JoyFund
          </h1>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-10">
            This is the space to introduce visitors to the business or brand.
            Briefly explain who's behind it, what it does, and what makes it
            unique. Share its core values and what this site has to offer.
          </p>
          <a
            href="/start"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg"
          >
            start a JoyFund
          </a>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">
                Our Story
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                This is a space to share more about the business: who's behind
                it, what it does, and what this site has to offer. It's an
                opportunity to tell the story behind the business or describe a
                special service or product it offers.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                You can use this section to share the company history or
                highlight a particular feature that sets it apart from
                competitors.
              </p>
              <a
                href="#"
                className="inline-block border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-7 py-3 rounded-full transition-all duration-200 text-sm"
              >
                Learn more
              </a>
            </div>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800&auto=format&fit=crop"
                alt="Our Story"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Our Vision
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                  This is a space to share more about the business: who's
                  behind it, what it does, and what this site has to offer.
                  It's an opportunity to tell the story behind the business or
                  describe a special service or product it offers. You can use
                  this section to share the company history or highlight a
                  particular feature that sets it apart from competitors.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why JoyFund */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop"
                alt="Why JoyFund"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">
                Why JoyFund
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                This is a space to share more about the business: who's behind
                it, what it does, and what this site has to offer. It's an
                opportunity to tell the story behind the business or describe a
                special service or product it offers.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                You can use this section to share the company history or
                highlight a particular feature that sets it apart from
                competitors.
              </p>
              <a
                href="/start"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3 rounded-full transition-all shadow-md text-sm"
              >
                start a JoyFund
              </a>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  );
}
