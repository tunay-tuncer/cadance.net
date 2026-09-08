"use client";

import React from "react";
import { MdCheckCircle, MdRadioButtonUnchecked } from "react-icons/md";
import styles from "./ShoppingCard.module.css";

interface PurchaseToggleButtonProps {
    id: string;
    isFinished: boolean;
    onToggle: (id: string, isFinished: boolean) => void;
}

const PurchaseToggleButton = ({ id, isFinished, onToggle }: PurchaseToggleButtonProps) => {
    const handleClick = (e: React.MouseEvent<SVGElement>) => {
        e.stopPropagation();
        onToggle(id, isFinished);
    };

    return isFinished ? (
        <MdCheckCircle
            className={`${styles.checkMark} ${styles.checkMarkActive}`}
            onClick={handleClick}
        />
    ) : (
        <MdRadioButtonUnchecked
            className={styles.checkMark}
            onClick={handleClick}
        />
    );
};

export default PurchaseToggleButton;