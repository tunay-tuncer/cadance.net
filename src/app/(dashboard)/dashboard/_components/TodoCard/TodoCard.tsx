"use client";

import { useEffect, useState } from "react";
import styles from "./TodoCard.module.css";
import BaseCard from "@/components/ui/BaseCard/BaseCard";
import TodoToggleButton from "./TodoToggleButton";
import { useAuth } from "@/context/AuthContext";
import { useProjectContext } from "@/context/ProjectContext";
import { format, parseISO, isSameDay } from "date-fns";
import {
    TodoItem,
    subscribeToUserTodos,
    addTodoToUser,
    toggleUserTodoStatus,
    deleteUserTodo,
    updateUserTodoDate,
} from "../../../../../lib/fireabase/todoService";
import TodoAddTodayButton from "./TodoAddTodayButton";
import TodoDeleteButton from "./TodoDeleteButton";

const TodoCard = () => {
    const { user } = useAuth();
    const { selectedDate } = useProjectContext();
    const [toDos, setToDos] = useState<TodoItem[]>([]);
    const [newTaskText, setNewTaskText] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    const today = format(new Date(), "yyyy-MM-dd");

    // Kullanıcı giriş yaptıysa seçilen tarihe ait todoları dinle
    useEffect(() => {
        if (!user?.uid) {
            setToDos([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToUserTodos(
            user.uid,
            (fetchedTodos) => {
                setToDos(fetchedTodos);
                setLoading(false);
            },
            selectedDate
        );

        return () => unsubscribe();
    }, [user?.uid, selectedDate]);

    // Durumu Firestore'da güncelle
    const handleToggle = async (id: string, isFinished: boolean) => {
        if (!user?.uid) return;
        try {
            await toggleUserTodoStatus(user.uid, id, isFinished);
        } catch (error) {
            console.error("Todo toggle error:", error);
        }
    };

    // Yeni görev ekle
    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newTaskText.trim() !== "" && user?.uid) {
            const taskToAdd = newTaskText.trim();
            setNewTaskText("");

            try {
                await addTodoToUser(user.uid, taskToAdd, selectedDate);
            } catch (error) {
                console.error("Todo ekleme hatası:", error);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!user?.uid) return;
        try {
            await deleteUserTodo(user.uid, id);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddToday = async (id: string) => {
        if (!user?.uid) return;
        try {
            await updateUserTodoDate(user.uid, id, today);
        } catch (error) {
            console.error("Error moving todo to today:", error);
        }
    };

    const unfinishedTodos = toDos.filter((item) => !item.isFinished);
    const finishedTodos = toDos.filter((item) => item.isFinished);

    const formattedDateLabel = (() => {
        if (!selectedDate) return "";
        try {
            const parsed = parseISO(selectedDate);
            if (isSameDay(parsed, new Date())) {
                return "Today";
            }
            return format(parsed, "EEE, MMM d");
        } catch {
            return selectedDate;
        }
    })();

    return (
        <BaseCard className={styles.todoCardContainer}>
            <div className={styles.headerArea}>
                <div className={styles.titleWrapper}>
                    <h3 className={styles.sectionTitle}>My Tasks</h3>
                    {formattedDateLabel && (
                        <span className={styles.dateLabel}>{formattedDateLabel}</span>
                    )}
                </div>
                <span className={styles.taskCounter}>
                    {loading ? "..." : `${unfinishedTodos.length} remaining`}
                </span>
            </div>

            <div className={styles.inputContainer}>
                <input
                    type="text"
                    placeholder={user ? "Add a new personal task..." : "Please log in to add tasks"}
                    className={styles.todoInput}
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!user}
                />
            </div>

            <div className={styles.listContainer}>
                {/* Unfinished Tasks */}
                <div className={styles.unfinishedTodoContainer}>
                    <span className={styles.groupLabel}>To Do</span>
                    <ul className={styles.todoList}>
                        {unfinishedTodos.map((item) => (
                            <li
                                key={item.id}
                                className={styles.todoItem}
                                onClick={() => handleToggle(item.id, item.isFinished)}
                            >
                                <TodoToggleButton
                                    id={item.id}
                                    isFinished={item.isFinished}
                                    onToggle={() => handleToggle(item.id, item.isFinished)}
                                />
                                <span className={styles.taskText}>{item.task}</span>
                                <div className={styles.itemActions}>
                                    {item.date !== today && (
                                        <TodoAddTodayButton
                                            id={item.id}
                                            onClick={() => handleAddToday(item.id)}
                                        />
                                    )}
                                    <TodoDeleteButton
                                        id={item.id}
                                        onClick={() => handleDelete(item.id)}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Finished Tasks */}
                {finishedTodos.length > 0 && (
                    <div className={styles.finishedTodoContainer}>
                        <span className={styles.groupLabel}>Completed</span>
                        <ul className={styles.todoList}>
                            {finishedTodos.map((item) => (
                                <li
                                    key={item.id}
                                    className={`${styles.todoItem} ${styles.doneItem}`}
                                    onClick={() => handleToggle(item.id, item.isFinished)}
                                >
                                    <TodoToggleButton
                                        id={item.id}
                                        isFinished={item.isFinished}
                                        onToggle={() => handleToggle(item.id, item.isFinished)}
                                    />
                                    <span className={`${styles.taskText} ${styles.strikeText}`}>
                                        {item.task}
                                    </span>
                                    <div className={styles.itemActions}>
                                        {item.date !== today && (
                                            <TodoAddTodayButton
                                                id={item.id}
                                                onClick={() => handleAddToday(item.id)}
                                            />
                                        )}
                                        <TodoDeleteButton
                                            id={item.id}
                                            onClick={() => handleDelete(item.id)}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Empty State */}
                {unfinishedTodos.length === 0 && finishedTodos.length === 0 && !loading && (
                    <div className={styles.emptyState}>
                        <p>No tasks scheduled for this day.</p>
                    </div>
                )}
            </div>
        </BaseCard>
    );
};

export default TodoCard;