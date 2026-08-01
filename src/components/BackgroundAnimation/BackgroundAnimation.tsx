"use client";

import { useEffect, useRef } from "react";
import styles from "./BackgroundAnimation.module.css";

interface Circle {
    x: number;
    y: number;
    size: number;
    speedY: number;
    hue: number;
    opacity: number;
    baseX: number;
}

const BackgroundAnimation = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        // Fare Pozisyonu
        const mouse = {
            x: -1000,
            y: -1000,
            radius: 120,
        };

        // Ekran boyutuna göre 30 daire oluştur
        const circles: Circle[] = [];
        const circleCount = 35;

        for (let i = 0; i < circleCount; i++) {
            const x = Math.random() * width;
            circles.push({
                x: x,
                baseX: x,
                y: Math.random() * height,
                size: Math.random() * 12 + 4, // 4px - 16px
                speedY: Math.random() * 0.75 + 0.25, // Uçuş hızı
                hue: Math.floor(Math.random() * 60) + 200, // Mavi - Mor tonları
                opacity: Math.random() * 0.5 + 0.3,
            });
        }

        // Pencere boyutu değiştiğinde canvas'ı güncelle
        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        // Fare hareketini dinle
        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        // Animasyon Döngüsü
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            circles.forEach((circle) => {
                // 1. Yukarı Doğru Uçuş
                circle.y -= circle.speedY;
                if (circle.y < -20) {
                    circle.y = height + 20;
                    circle.x = Math.random() * width;
                    circle.baseX = circle.x;
                }

                // 2. Fare Etkileşimi (İtilme Fiziği)
                const dx = mouse.x - circle.x;
                const dy = mouse.y - circle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (mouse.radius - distance) / mouse.radius;
                    const pushX = Math.cos(angle) * force * 8;
                    const pushY = Math.sin(angle) * force * 8;

                    circle.x -= pushX;
                    circle.y -= pushY;
                } else {
                    // Fare uzaklaşınca yavaşça eski yatay konumuna döner
                    circle.x += (circle.baseX - circle.x) * 0.05;
                }

                // 3. Çizim (Glow/Parlama Efekti)
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.size, 0, Math.PI * 2);

                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsla(${circle.hue}, 80%, 65%, 0.8)`;
                ctx.fillStyle = `hsla(${circle.hue}, 80%, 65%, ${circle.opacity})`;
                ctx.fill();
                ctx.shadowBlur = 0; // Performans için shadow sıfırlama
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className={styles.canvasContainer} />;
};

export default BackgroundAnimation;