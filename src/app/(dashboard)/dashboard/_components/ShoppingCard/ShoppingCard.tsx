"use client"

import { useState, useEffect } from "react";
import styles from "./ShoppingCard.module.css"
import BaseCard from "@/components/ui/BaseCard/BaseCard";
import { useAuth } from "@/context/AuthContext";
import PurchaseToggleButton from "./PurchaseToggleButton";
import PurchaseDeleteButton from "./PurchaseDeleteButton";
import {
    PurchaseItem,
    subscribeToUserPurchase,
    addPurhcaseToUser,
    toggleUserPurchaseStatus,
    deleteUserPurchase
} from "../../../../../lib/fireabase/purchaseService";

const ShoppingCard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [newPurchaseText, setNewPurchaseText] = useState<string>("");
    const [purchase, setPurchase] = useState<PurchaseItem[]>([]);

    useEffect(() => {
        if (!user?.uid) {
            setPurchase([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToUserPurchase(user.uid, (fetchedPurchase) => {
            setPurchase(fetchedPurchase);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleToggle = async (id: string, isFinished: boolean) => {
        if (!user?.uid) return;
        try {
            await toggleUserPurchaseStatus(user.uid, id, isFinished);
        } catch (error) {
            console.error("Purchase toggle error:", error);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newPurchaseText.trim() !== "" && user?.uid) {
            const purchaseToAdd = newPurchaseText.trim();
            setNewPurchaseText("");

            try {
                await addPurhcaseToUser(user.uid, purchaseToAdd);
            } catch (error) {
                console.error("Purchase ekleme hatası:", error);
            }
        }
    };

    const handleDelete = async (id: string,) => {
        if (!user?.uid) return;
        try {
            await deleteUserPurchase(user.uid, id)
        }
        catch (error) {
            console.error(error)
        }
    }


    const finishedPurchase = purchase.filter((item) => item.isFinished);
    const unFinishedPurchase = purchase.filter((item) => !item.isFinished);

    return (
        <BaseCard className={styles.purchaseCardContainer}>
            <div className={styles.headerArea}>
                <h3 className={styles.sectionTitle}>Purchase</h3>
                <span className={styles.purchaseCounter}>
                    {loading ? "..." : `${unFinishedPurchase.length} remaining`}
                </span>
            </div>

            <div className={styles.inputContainer}>
                <input
                    type="text"
                    placeholder="Add a new personal task..."
                    className={styles.purchaseInput}
                    value={newPurchaseText}
                    onChange={(e) => setNewPurchaseText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!user}
                />
            </div>

            <div className={styles.listContainer}>
                {/* Unfinished Tasks */}
                <div className={styles.unfinishedPurchaseContainer}>
                    <span className={styles.groupLabel}>PURCHASE</span>
                    <ul className={styles.purchaseList}>
                        {unFinishedPurchase.map((item) => (
                            <li
                                key={item.id}
                                className={styles.purchaseItem}
                                onClick={() => handleToggle(item.id, item.isFinished)}
                            >
                                <PurchaseToggleButton
                                    id={item.id}
                                    isFinished={item.isFinished}
                                    onToggle={() => handleToggle(item.id, item.isFinished)}
                                />
                                <span className={styles.purchaseText}>{item.purchase}</span>
                                <PurchaseDeleteButton id={item.id} onClick={() => handleDelete(item.id)} />
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Finished Tasks */}
                {finishedPurchase.length > 0 && (
                    <div className={styles.finishedTodoContainer}>
                        <span className={styles.groupLabel}>Completed</span>
                        <ul className={styles.purchaseList}>
                            {finishedPurchase.map((item) => (
                                <li
                                    key={item.id}
                                    className={`${styles.purchaseItem} ${styles.doneItem}`}
                                    onClick={() => handleToggle(item.id, item.isFinished)}
                                >
                                    <PurchaseToggleButton
                                        id={item.id}
                                        isFinished={item.isFinished}
                                        onToggle={() => handleToggle(item.id, item.isFinished)}
                                    />
                                    <span className={`${styles.purchaseText} ${styles.strikeText}`}>
                                        {item?.purchase}
                                    </span>
                                    <PurchaseDeleteButton id={item.id} onClick={() => handleDelete(item.id)} />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </BaseCard>
    )
}

export default ShoppingCard
