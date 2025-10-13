'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    desktop: '/images/ImagemDesk.png',
    mobile: '/images/ImagemMobumum.png',
    title: 'MEMBROS FIT',
    description: 'TRANSFORME SUA ROTINA\nCOM TREINOS PERSONALIZADOS',
  },
  {
    desktop: '/images/imagemDeskdois.png',
    mobile: '/images/ImagemMobnegona.png',
    title: 'MEMBROS FIT', 
    description: 'ALIMENTAÇÃO SAUDÁVEL\nPARA SEU OBJETIVO',
  },
  {
    desktop: '/images/imagemDesktres.png',
    mobile: '/images/ImagemMobtres.png',
    title: 'MEMBROS FIT',
    description: 'MONITORE SEU\nPROGRESSO',
  },
  {
    desktop: '/images/ImagemDietDesk.png',
    mobile: '/images/ImagemMobdiet.png',
    title: 'MEMBROS FIT',
    description: 'PLANOS\nPERSONALIZADOS', 
  },
  {
    desktop: '/images/ImagemDietDeskdois.png',
    mobile: '/images/ImagemMobdietdois.png',
    title: 'MEMBROS FIT',
    description: 'COMECE AGORA\nSUA TRANSFORMAÇÃO',
  },
];

export default function WelcomePage() {
  const [index, setIndex] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#111111] text-white relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={isMobile ? slides[index].mobile : slides[index].desktop}
            alt={`Slide ${index + 1}`}
            fill
            sizes="100vw"
            quality={100}
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/90 via-[#111111]/80 to-[#111111]/90" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-screen flex flex-col items-center justify-center p-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute top-10 md:top-20"
        >
          <Image
            src="/images/Logo.png"
            alt="Logo MembrosFit"
            width={isMobile ? 180 : 240}
            height={isMobile ? 90 : 120}
            className="mx-auto drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]"
          />
        </motion.div>

        <div className="absolute top-6 md:top-8 right-6 md:right-8 flex gap-4 md:gap-6">
          <a
            href="/auth/login"
            className="font-bebas-neue text-lg md:text-xl text-white hover:text-[#00ff88] transition-all duration-300 tracking-wider"
          >
            Entrar
          </a>
          <a
            href="/register"
            className="font-bebas-neue text-lg md:text-xl text-white hover:text-[#00ff88] transition-all duration-300 tracking-wider"
          >
            Registrar
          </a>
        </div>

        <motion.h1
          key={`title-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-bebas-neue text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 text-white tracking-tight uppercase relative before:absolute before:-inset-2 before:block before:-skew-y-3 before:bg-[#00ff88] before:opacity-30 before:blur-md"
        >
          <span className="relative drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]">
            {slides[index].title}
          </span>
        </motion.h1>

        <motion.h2
          key={`subtitle-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-rajdhani text-lg sm:text-xl md:text-2xl lg:text-3xl text-[#d9d9d9] tracking-wider uppercase mb-10 max-w-3xl leading-relaxed"
        >
          {slides[index].description.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </motion.h2>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${i === index ? 'bg-[#00ff88]' : 'bg-[#737373]'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
