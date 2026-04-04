import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const topFunds = [
  { image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop", title: "Silas 27th birthday", description: "Flying Silas wishes the save delivery of 20 babies as his birthday present." },
  { image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop", title: "Silas 27th birthday", description: "Flying Silas wishes the save delivery of 20 babies as his birthday present." },
  { image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop", title: "Silas 27th birthday", description: "Flying Silas wishes the save delivery of 20 babies as his birthday present." },
  { image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop", title: "Silas 27th birthday", description: "Flying Silas wishes the save delivery of 20 babies as his birthday present." },
  { image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop", title: "Silas 27th birthday", description: "Flying Silas wishes the save delivery of 20 babies as his birthday present." },
  { image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&auto=format&fit=crop", title: "Silas 27th birthday", description: "Flying Silas wishes the save delivery of 20 babies as his birthday present." },
];

const topDonors = [
  { name: "Tami", amount: "45,000 Frs donated", fund: "Donated to Silas 21st birthday", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&auto=format&fit=crop" },
  { name: "Mirella", amount: "40,000 Frs donated", fund: "Donated to Silas 21st birthday", image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=80&auto=format&fit=crop" },
  { name: "Bryan", amount: "40,000 Frs donated", fund: "Donated to Silas 21st birthday", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop" },
  { name: "Lili", amount: "40,000 Frs donated", fund: "Donated to Silas 21st birthday", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop" },
  { name: "Jamal", amount: "40,000 Frs donated", fund: "Donated to Silas 21st birthday", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&auto=format&fit=crop" },
  { name: "Leroy", amount: "40,000 Frs donated", fund: "Donated to Silas 21st birthday", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop" },
];

export default function LeaderboardPage() {
  return (
    <main>
      {/* Hero with blue gradient */}
      <section className="relative min-h-[340px] flex flex-col overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1600&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/90 to-blue-500/70" />
        <Navbar transparent />
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 pt-8 pb-16 max-w-7xl mx-auto w-full">
          <div className="max-w-lg">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Get to know who your top donors are
            </h1>
            <p className="text-blue-100 text-sm md:text-base">
              Get to know who your top donors are across every JoyFund and say thanks
            </p>
          </div>
        </div>
      </section>

      {/* Top Funds Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topFunds.map((fund, i) => (
                <div key={i} className="flex flex-col">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3">
                    <img
                      src={fund.image}
                      alt={fund.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{fund.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{fund.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Fund + Donor Leaderboard */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: featured fund card */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Fund card */}
              <div className="rounded-2xl overflow-hidden shadow-md">
                <div className="aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop"
                    alt="Top fund"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">Silas 27th birthday</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Flying Silas wishes the save delivery of 20 babies as his birthday present.
                  </p>
                </div>
              </div>

              {/* Amount raised */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <p className="text-5xl md:text-6xl font-bold text-gray-900 leading-none">600K</p>
                <p className="text-xl font-semibold text-gray-700 mt-2">Raised</p>
              </div>

              {/* Top donor card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium">Top Donor</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&auto=format&fit=crop"
                      alt="Top donor"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Tami Bukuyy</p>
                    <p className="text-gray-500 text-xs mt-0.5">Amount</p>
                    <p className="font-bold text-gray-900 text-sm">40,000 FCFA</p>
                  </div>
                </div>
                <button className="mt-4 w-full border border-gray-200 text-gray-700 text-xs font-medium py-2 rounded-full hover:bg-gray-50 transition-colors">
                  Say thanks
                </button>
              </div>
            </div>

            {/* Right: Leaderboard list */}
            <div className="lg:col-span-3">
              <div className="bg-blue-50 rounded-3xl p-6 h-full">
                <div className="flex flex-col gap-3">
                  {topDonors.map((donor, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={donor.image}
                          alt={donor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{donor.name}</p>
                        <p className="text-blue-600 text-xs font-semibold">{donor.amount}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{donor.fund}</p>
                        <button className="mt-1 text-blue-500 text-xs hover:text-blue-700 font-medium transition-colors">
                          Say thanks
                        </button>
                      </div>
                      <span className="text-gray-200 font-bold text-lg">#{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  );
}
