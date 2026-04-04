"use client";
import { useState, useRef } from "react";
import {
  Cake,
  GraduationCap,
  Heart,
  Megaphone,
  Upload,
} from "lucide-react";

const eventTypes = [
  { label: "Birthday", icon: Cake },
  { label: "Graduation", icon: GraduationCap },
  { label: "Wedding", icon: Heart },
  { label: "Promotion", icon: Megaphone },
];

export default function StartCampaignPage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [wish, setWish] = useState("");
  const [target, setTarget] = useState("");
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel */}
      <div className="relative md:w-5/12 lg:w-2/5 min-h-[260px] md:min-h-screen flex flex-col justify-center px-10 py-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=900&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-blue-700/75" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            JoyFund
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug">
            Lets begin your Journey with JoyFund.
          </h2>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            take your first steps today to helping someone who desperately needs
            it
          </p>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 bg-white flex items-start justify-center py-12 px-6 md:px-12 overflow-y-auto">
        <div className="w-full max-w-lg">

          {/* Avatar upload */}
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg hover:shadow-xl transition-shadow group"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1609220136736-443140cffec6?w=200&auto=format&fit=crop"
                  alt="placeholder avatar"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload size={20} className="text-white" />
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="border-t border-gray-100 mb-8" />

          {/* Event type selector */}
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-4 text-sm">
              What event are you creating a JoyFund for?
            </label>
            <div className="grid grid-cols-4 gap-3">
              {eventTypes.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedEvent(label)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selectedEvent === label
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-blue-100 bg-blue-50/50 hover:border-blue-300"
                  }`}
                >
                  <Icon
                    size={22}
                    className={selectedEvent === label ? "text-blue-600" : "text-gray-500"}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-xs font-medium ${
                      selectedEvent === label ? "text-blue-700" : "text-gray-600"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 mb-8" />

          {/* Cover image upload */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full aspect-[16/7] rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 hover:border-blue-400 flex flex-col items-center justify-center gap-3 overflow-hidden transition-all group"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={24} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-blue-400 text-sm font-medium group-hover:text-blue-600 transition-colors">
                    Upload a cover image
                  </span>
                </>
              )}
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          <div className="border-t border-gray-100 mb-8" />

          {/* Wish input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3 text-sm">
              Write a wish for your JoyFund; example ( 5 save deliveries )
            </label>
            <input
              type="text"
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="Five save deliveries"
              className="w-full bg-blue-50 rounded-2xl px-5 py-4 text-gray-700 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all border border-transparent focus:border-blue-300"
            />
          </div>

          <div className="border-t border-gray-100 mb-8" />

          {/* Target amount */}
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-3 text-sm">
              What is your target amount for this JoyFund
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="FCFA  500,000"
              className="w-full bg-blue-50 rounded-2xl px-5 py-4 text-gray-700 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all border border-transparent focus:border-blue-300"
            />
          </div>

          <div className="border-t border-gray-100 mb-8" />

          {/* Checkboxes + submit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree1}
                  onChange={(e) => setAgree1(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-gray-600 text-sm">I agree to the terms and policies</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree2}
                  onChange={(e) => setAgree2(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-gray-600 text-sm">I agree to the terms and policies</span>
              </label>
            </div>

            <button
              type="button"
              disabled={!agree1 || !agree2 || !selectedEvent}
              className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm"
            >
              Create JoyFund
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
