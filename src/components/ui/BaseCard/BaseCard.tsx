// src/components/ui/BaseCard/BaseCard.tsx
import React from "react";
import styles from "./BaseCard.module.css";

interface BaseCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    hoverable?: boolean;
}

export default function BaseCard({
    children,
    className = "",
    onClick,
    hoverable = false,
}: BaseCardProps) {
    return (
        <div
            className={`${styles.card} ${hoverable ? styles.hoverable : ""} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}