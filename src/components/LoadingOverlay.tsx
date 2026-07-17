import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Sparkles, Heart } from "lucide-react";

const COMFORT_QUOTES = [
  "지친 하루의 끝, 너의 깊은 고민마저 따뜻하게 품어줄게.",
  "아무에게도 쉽게 털어놓지 못했던 이야기, 여기에 편히 내려놓아도 돼.",
  "지금은 잠시 네 마음을 깊게 쉬어가도 괜찮은 시간이야.",
  "마음쉼 분석가가 네 이야기를 꼼꼼히 읽고 정성을 다해 엽서를 적는 중이야...",
  "네 감정은 언제나 그 자체로 소중하고 가치 있어.",
  "조금만 기다려줘, 너의 상처 입은 마음에 살포시 닿을 편지가 도착할 거야.",
  "숨이 가쁠 때는 큰 숨을 세 번만 들이쉬고 천천히 내쉬어보자."
];

export default function LoadingOverlay() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % COMFORT_QUOTES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50/95 backdrop-blur-md px-6 text-center">
      <div className="relative mb-8">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shadow-md relative"
        >
          <Mail className="w-10 h-10" />
          <motion.div
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-1 -right-1 text-amber-500"
          >
            <Sparkles className="w-5 h-5 fill-current" />
          </motion.div>
        </motion.div>
      </div>

      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-1.5"
      >
        <span>마음 전하는 중</span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }}
          className="text-violet-600"
        >
          ●
        </motion.span>
      </motion.h3>

      <div className="h-16 max-w-md flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-stone-600 font-medium text-sm md:text-base leading-relaxed font-batang"
          >
            &ldquo;{COMFORT_QUOTES[quoteIndex]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-12 flex gap-1 justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -6, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
            className="w-2 h-2 rounded-full bg-violet-400"
          />
        ))}
      </div>
    </div>
  );
}
