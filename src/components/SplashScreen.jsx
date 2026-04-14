import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
    const canvasRef = useRef(null);

    // Canvas visualization effect (Neural/Constellation network)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        // Resize canvas
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Particles
        const particles = [];
        const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 15000);
        
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                radius: Math.random() * 2 + 1
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1e293b'; // Slate 800 background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw and update particles
            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'; // Slate 400
                ctx.fill();

                // Draw lines to nearby particles
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(148, 163, 184, ${1 - dist / 150})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Complete splash after 3.5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            {/* Visualisation Video / Canvas effect */}
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-900/50" />

            <div className="relative z-10 flex flex-col items-center justify-center">
                {/* Logo Animation */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, type: "spring" }}
                    className="flex flex-col items-center"
                >
                    {/* SVG Logo approximating the image provided (an intertwined a/i or ok style shape) */}
                    {/* User can replace this SVG with an <img src="/logo.png" /> if they save their image there */}
                    <div className="w-32 h-32 md:w-48 md:h-48 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Slanted Pill Shape */}
                            <rect x="25" y="45" width="22" height="55" rx="11" transform="rotate(-35 25 45)" stroke="currentColor" strokeWidth="8" />
                            {/* Intersecting Line */}
                            <path d="M48 60 L65 85 M55 45 L62 30" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                            {/* Dot */}
                            <circle cx="70" cy="20" r="5" fill="currentColor" />
                        </svg>
                    </div>

                    <motion.h1 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="text-4xl md:text-6xl font-bold tracking-widest text-white drop-shadow-lg"
                    >
                        ChaosOps
                    </motion.h1>
                    
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 1.5, duration: 1.5, ease: "easeInOut" }}
                        className="h-px bg-white/50 mt-4"
                    />

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 0.8 }}
                        className="mt-4 text-slate-300 tracking-wider text-sm md:text-base uppercase"
                    >
                        Zero-Downtime
                    </motion.p>
                </motion.div>
            </div>

            {/* Developer Credit Footer */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.8 }}
                className="absolute bottom-8 w-full text-center z-20"
            >
                <p className="text-slate-500 text-xs md:text-sm tracking-widest font-light">
                    DEVELOPED BY <a href="https://githubio-ten.vercel.app" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors underline decoration-slate-600 hover:decoration-white underline-offset-4 font-medium tracking-normal">albertlivingstan.dev.com</a>
                </p>
            </motion.div>
        </motion.div>
    );
}
