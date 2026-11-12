export default function Marquee({ items = [] }) {
  const list = items.length ? items : ["Portrait", "Wedding", "Event", "Product", "Graduation", "Film"];
  return (
    <div className="overflow-hidden border-y border-white/10 bg-[#0D0E10] py-6">
      <div className="marquee-track flex w-max items-center gap-12 pr-12">
        {[...list, ...list].map((item, i) => (
          <span key={i} className="flex items-center gap-12">
            <span className={`whitespace-nowrap font-display text-2xl italic md:text-3xl ${i % 2 ? "text-neutral-500" : "text-white"}`}>
              {item}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-neutral-600">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
