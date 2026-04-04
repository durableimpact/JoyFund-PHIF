interface FundCardProps {
  image: string;
  title: string;
  description: string;
  showDonate?: boolean;
}

export default function FundCard({
  image,
  title,
  description,
  showDonate = true,
}: FundCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {/* Card image */}
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-3">
          {description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline-offset-2 hover:underline transition-colors"
          >
            Learn more
          </a>
          {showDonate && (
            <a
              href="#"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-sm hover:shadow-md"
            >
              donate
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
