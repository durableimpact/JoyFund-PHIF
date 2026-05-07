import FundCard from "./FundCard";

const funds = [
  {
    image:
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&auto=format&fit=crop",
    title: "Elena's 21st birthday",
    description:
      "This JoyFund is dedicated to our beloved daughter Elena who is celebrating her 21st birthday and needs your support for her healthcare.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&auto=format&fit=crop",
    title: "Elena's 21st birthday",
    description:
      "This JoyFund is dedicated to our beloved daughter Elena who is celebrating her 21st birthday and needs your support for her healthcare.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop",
    title: "Elena's 21st birthday",
    description:
      "This JoyFund is dedicated to our beloved daughter Elena who is celebrating her 21st birthday and needs your support for her healthcare.",
  },
];

export default function FeaturedFunds() {
  return (
    <section id="featured" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3">
          Featured JoyFunds
        </h2>
        <p className="text-gray-500 text-center max-w-xl mx-auto mb-12 leading-relaxed text-sm md:text-base">
          Discover JoyFunds created by people just like you — turning life's
          milestones into meaningful health support.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {funds.map((fund, index) => (
            <FundCard key={index} {...fund} showDonate={true} />
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="#"
            className="inline-block border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-8 py-3 rounded-full transition-all duration-200 text-sm"
          >
            Explore all JoyFunds
          </a>
        </div>
      </div>
    </section>
  );
}
