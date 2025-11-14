import Navbar from "@/components/Navbar";
import HeroButtons from "@/components/HeroButtons";
import { Inter } from "next/font/google";
import DarkVeil from "@/components/DarkVeil";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main>
      <Head>
        <title>E-Noki - 2025</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <section className="hero relative">
        <div className="bg absolute top-0 left-0 h-screen z-[-1] opacity-50 w-full">
          {/* <PixelBlast
            variant="circle"
            pixelSize={6}
            color="#B19EEF"
            patternScale={3}
            patternDensity={1.2}
            pixelSizeJitter={0.5}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.6}
            edgeFade={0.25}
            transparent
          /> */}
          <DarkVeil />
        </div>
      </section>
      <section className="text-white mx-auto max-w-[70%]">
        <h1
          className={`${inter.className} font-[700] tracking-tighter text-[4rem] leading-tight text-center pt-[20rem]`}
        >
          A modern solution for smarter, smoother school operations.
        </h1>
        <HeroButtons />
        <p className="font-mono mt-10 text-neutral-600 text-center select-none">
          Developed by E-Noki @ 2025, v0.1.0 beta
        </p>
      </section>
    </main>
  );
}
