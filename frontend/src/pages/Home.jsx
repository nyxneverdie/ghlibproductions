import { useEffect, useState } from "react";
import api from "@/lib/api";
import Nav from "@/components/marketing/nav";
import Hero from "@/components/marketing/Hero";
import Marquee from "@/components/marketing/Marquee";
import Works from "@/components/marketing/Works";
import Film from "@/components/marketing/Film";
import Categories from "@/components/marketing/Categories";
import About from "@/components/marketing/About";
import Services from "@/components/marketing/Services";
import { BookingCTA, PortalCTA, Footer } from "@/components/marketing/Closing";
import { initLenis, destroyLenis } from "@/lib/lenis";

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const lenis = initLenis();
    api.get("/public/home").then((r) => setData(r.data)).catch(() => setData({}));
    return () => destroyLenis();
  }, []);

  const profile = data?.profile || {};
  const featured = (data?.portfolio || []).filter((p) => p.featured);
  const filmStills = (data?.portfolio || []).filter((p) => p.category === "Film");

  return (
    <div className="min-h-screen bg-[#08090A] text-white">
      <Nav />
      <Hero profile={profile} />
      <Marquee items={data?.categories} />
      <Works items={featured} />
      <Film items={filmStills} />
      <Categories categories={data?.categories || []} portfolio={data?.portfolio || []} />
      <About profile={profile} categories={data?.categories} />
      <Services services={data?.services || []} />
      <BookingCTA />
      <PortalCTA />
      <Footer profile={profile} />
    </div>
  );
}
