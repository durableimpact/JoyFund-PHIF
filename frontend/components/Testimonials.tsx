import FundCard from "./FundCard";

const testimonials = [
  {
    image:
      "https://images.unsplash.com/photo-1519682577862-22b62b24cb12?w=600&auto=format&fit=crop",
    title: "Elena's 21st birthday",
    description:
      "This JoyFund is dedicated to our beloved daughter Elena who is celebrating her 21st birthday.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=600&auto=format&fit=crop",
    title: "Elena's 21st birthday",
    description:
      "This JoyFund is dedicated to our beloved daughter Elena who is celebrating her 21st birthday.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&auto=format&fit=crop",
    title: "Elena's 21st birthday",
    description:
      "This JoyFund is dedicated to our beloved daughter Elena who is celebrating her 21st birthday.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3">
          Testimonials
        </h2>
        <p className="text-gray-500 text-center max-w-xl mx-auto mb-12 leading-relaxed text-sm md:text-base">
          Hear from families and friends who turned their celebrations into
          life-changing gifts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <FundCard key={index} {...item} showDonate={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
