import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';

const variants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};

export default function AppLayout() {
  const location = useLocation();
  const mainRef = useRef(null);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        ref={mainRef}
        className="flex-1 md:ml-60 overflow-y-auto no-overscroll pb-16 md:pb-0 relative"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>

        {/* Global Developer Footer */}
        <footer className="w-full py-8 mt-12 border-t border-slate-800/40 text-center">
            <p className="text-slate-500 text-xs tracking-widest font-light uppercase">
                Developed by <a href="https://githubio-ten.vercel.app" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors underline decoration-slate-700 hover:decoration-white underline-offset-4 font-medium tracking-normal lowercase">albertlivingstan.dev.com</a>
            </p>
        </footer>
      </main>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden">
        <BottomTabBar />
      </div>
    </div>
  );
}