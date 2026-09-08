"use client"

import { useState, useEffect } from "react";
import BaseCard from "@/components/ui/BaseCard/BaseCard";
import GoalToggleButton from "./GoalToggleButton";
import GoalDeleteButton from "./GoalDeleteButton";
import styles from "./GoalsCard.module.css";
import { useAuth } from "@/context/AuthContext";
import {
    GoalItem,
    subscribeToUserGoals,
    addGoalsToUser,
    toggleUserGoalStatus,
    deleteUserGoal
} from "../../../../../lib/fireabase/goalService";

const GoalsCard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [newGoalText, setNewGoalText] = useState<string>("");
    const [goals, setGoals] = useState<GoalItem[]>([]);

    useEffect(() => {
        if (!user?.uid) {
            setGoals([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToUserGoals(user.uid, (fetchedGoals) => {
            setGoals(fetchedGoals);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleToggle = async (id: string, isFinished: boolean) => {
        if (!user?.uid) return;
        try {
            await toggleUserGoalStatus(user.uid, id, isFinished);
        } catch (error) {
            console.error("Todo toggle error:", error);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newGoalText.trim() !== "" && user?.uid) {
            const taskToAdd = newGoalText.trim();
            setNewGoalText("");

            try {
                await addGoalsToUser(user.uid, taskToAdd);
            } catch (error) {
                console.error("Goal ekleme hatası:", error);
            }
        }
    };

    const handleDelete = async (id: string,) => {
        if (!user?.uid) return;
        try {
            await deleteUserGoal(user.uid, id)
        }
        catch (error) {
            console.error(error)
        }
    }

    const finishedGoals = goals.filter((item) => item.isFinished);
    const unFinishedGoals = goals.filter((item) => !item.isFinished);

    return (
        <BaseCard className={styles.goalsCardContainer}>

            <div className={styles.headerArea}>
                <h3 className={styles.sectionTitle}>Goals</h3>
                <span className={styles.goalCounter}>
                    {loading ? "..." : `${unFinishedGoals.length} remaining`}
                </span>
            </div>

            <div className={styles.inputContainer}>
                <input
                    type="text"
                    placeholder="Add a new personal task..."
                    className={styles.goalInput}
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!user}
                />
            </div>

            <div className={styles.listContainer}>
                {/* Unfinished Tasks */}
                <div className={styles.unfinishedGoalContainer}>
                    <span className={styles.groupLabel}>GOALS</span>
                    <ul className={styles.goalList}>
                        {unFinishedGoals.map((item) => (
                            <li
                                key={item.id}
                                className={styles.goalItem}
                                onClick={() => handleToggle(item.id, item.isFinished)}
                            >
                                <GoalToggleButton
                                    id={item.id}
                                    isFinished={item.isFinished}
                                    onToggle={() => handleToggle(item.id, item.isFinished)}
                                />
                                <span className={styles.goalText}>{item.goal}</span>
                                <GoalDeleteButton id={item.id} onClick={() => handleDelete(item.id)} />
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Finished Tasks */}
                {finishedGoals.length > 0 && (
                    <div className={styles.finishedTodoContainer}>
                        <span className={styles.groupLabel}>Completed</span>
                        <ul className={styles.goalList}>
                            {finishedGoals.map((item) => (
                                <li
                                    key={item.id}
                                    className={`${styles.goalItem} ${styles.doneItem}`}
                                    onClick={() => handleToggle(item.id, item.isFinished)}
                                >
                                    <GoalToggleButton
                                        id={item.id}
                                        isFinished={item.isFinished}
                                        onToggle={() => handleToggle(item.id, item.isFinished)}
                                    />
                                    <span className={`${styles.taskText} ${styles.strikeText}`}>
                                        {item.goal}
                                    </span>
                                    <GoalDeleteButton id={item.id} onClick={() => handleDelete(item.id)} />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

        </BaseCard >
    )
}

export default GoalsCard