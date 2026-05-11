import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import Link from "next/link";

interface CampaignCardProps {
  image: string;
  title: string;
  description: string;
  raised: string;
  progress: number;
}

function CampaignCard({ image, title, description, raised, progress }: CampaignCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{description}</p>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
          <div
            className="bg-blue-500 h-1.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <a
            href="#"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all"
          >
            donate
          </a>
          <span className="text-gray-500 text-xs font-medium">{raised} raised</span>
        </div>
      </div>
    </div>
  );
}

const birthdayFunds = [
  { image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "293k", progress: 65 },
  { image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "260k", progress: 52 },
  { image: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "350k", progress: 80 },
  { image: "https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "190k", progress: 40 },
  { image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "290k", progress: 58 },
  { image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "410k", progress: 85 },
];

const weddingFunds = [
  { image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "350k", progress: 70 },
  { image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "200k", progress: 44 },
  { image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "395k", progress: 78 },
  { image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "350k", progress: 62 },
  { image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "200k", progress: 38 },
  { image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "340k", progress: 73 },
];

const graduationFunds = [
  { image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "290k", progress: 55 },
  { image: "https://images.unsplash.com/photo-1627556704302-624286467c65?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "190k", progress: 42 },
  { image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "351k", progress: 71 },
  { image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "291k", progress: 60 },
  { image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "190k", progress: 35 },
  { image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&auto=format&fit=crop", title: "Derick's 25 birthday", description: "Derick's birthday wish is that a child is born safe and the Health Supports Derick's initiative.", raised: "300k", progress: 82 },
];

function FundSection({ title, funds }: { title: string; funds: CampaignCardProps[] }) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {funds.map((fund, i) => (
            <CampaignCard key={i} {...fund} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ExplorePage() {
  return (
    <main className="bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
                Explore Top JoyFunds Making The Most Impact Today.
              </h1>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Save someone today by donating to their JoyFunds, or start one for someone you care about.
              </p>
              <Link
                href="/start"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg text-sm"
              >
                start a JoyFund
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800&auto=format&fit=crop"
                  alt="JoyFund hero"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-gray-50">
        <FundSection title="Birthday JoyFunds" funds={birthdayFunds} />
        <div className="border-t border-gray-200" />
        <FundSection title="Weddings JoyFunds" funds={weddingFunds} />
        <div className="border-t border-gray-200" />
        <FundSection title="Graduation JoyFunds" funds={graduationFunds} />
      </div>

      <CTASection />
      <Footer />
    </main>
  );
}
