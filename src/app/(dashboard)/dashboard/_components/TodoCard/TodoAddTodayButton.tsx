"use client";
import React from "react";
import { MdCalendarToday } from "react-icons/md";
import styles from "./TodoCard.module.css";

interface TodoAddTodayButtonProps {
    id: string;
    onClick: (id: string) => void;
}

const TodoAddTodayButton = ({ id, onClick }: TodoAddTodayButtonProps) => {
    const handleClick = (e: React.MouseEvent<SVGElement>) => {
        e.stopPropagation();
        onClick(id);
    };

    return (
        <MdCalendarToday
            className={styles.addTodayButton}
            onClick={handleClick}
            title="Move to today"
            aria-label="Move to today"
        />
    );
};

export default TodoAddTodayButton;