"use client";

import { useEffect, useState } from "react";
import styles from "./NotesCard.module.css";
import BaseCard from "@/components/ui/BaseCard/BaseCard";
import { useAuth } from "@/context/AuthContext";
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlinePencilSquare,
    HiOutlineCheck,
    HiOutlineXMark,
} from "react-icons/hi2";
import {
    NoteItem,
    subscribeToUserNotes,
    addNoteToUser,
    updateUserNote,
    deleteUserNote,
} from "../../../../../lib/fireabase/noteService";

const NotesCard = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [newNote, setNewNote] = useState<string>("");
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>("");

    useEffect(() => {
        if (!user?.uid) {
            setNotes([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToUserNotes(user.uid, (fetchedNotes) => {
            setNotes(fetchedNotes);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleAddNote = async () => {
        if (!newNote.trim() || !user?.uid) return;

        const colorIndex = notes.length % 3;
        const noteText = newNote.trim();

        setNewNote("");
        setIsAdding(false);

        try {
            await addNoteToUser(user.uid, noteText, colorIndex);
        } catch (error) {
            console.error("Not eklenirken hata oluştu:", error);
        }
    };

    const handleStartEdit = (item: NoteItem) => {
        setEditingId(item.id);
        setEditingText(item.note);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingText("");
    };

    const handleSaveEdit = async (id: string) => {
        if (!user?.uid || !editingText.trim()) return;

        try {
            await updateUserNote(user.uid, id, editingText);
            setEditingId(null);
            setEditingText("");
        } catch (error) {
            console.error("Not güncellenirken hata oluştu:", error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!user?.uid) return;

        try {
            await deleteUserNote(user.uid, id);
        } catch (error) {
            console.error("Not silinirken hata oluştu:", error);
        }
    };

    return (
        <BaseCard className={styles.noteCardContainer}>
            {/* HEADER */}
            <div className={styles.headerArea}>
                <div className={styles.titleWrapper}>
                    <h3 className={styles.sectionTitle}>Sticky Notes</h3>
                    <span className={styles.noteCounter}>
                        {loading ? "..." : `${notes.length} notes`}
                    </span>
                </div>
                <button
                    type="button"
                    className={styles.addNoteBtn}
                    onClick={() => setIsAdding((prev) => !prev)}
                    disabled={!user}
                >
                    <HiOutlinePlus className={styles.btnIcon} />
                    <span>New Note</span>
                </button>
            </div>

            {/* QUICK ADD FORM */}
            {isAdding && (
                <div className={styles.addForm}>
                    <textarea
                        placeholder="Write a quick thought, dimension, or memo..."
                        className={styles.noteTextarea}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                        autoFocus
                    />
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={() => {
                                setIsAdding(false);
                                setNewNote("");
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={styles.saveBtn}
                            onClick={handleAddNote}
                        >
                            Pin Note
                        </button>
                    </div>
                </div>
            )}

            {/* STICKY NOTES GRID LIST */}
            <div className={styles.notesGrid}>
                {notes.length === 0 && !loading ? (
                    <div className={styles.emptyState}>
                        <p>No sticky notes yet. Pin your first studio thought!</p>
                    </div>
                ) : (
                    notes.map((item) => (
                        <div
                            key={item.id}
                            className={`${styles.stickyNote} ${item.colorIndex === 1
                                ? styles.noteTeal
                                : item.colorIndex === 2
                                    ? styles.noteRose
                                    : styles.noteAmber
                                }`}
                        >
                            <div className={styles.notePin} />

                            {editingId === item.id ? (
                                /* INLINE EDIT VIEW */
                                <div className={styles.inlineEditArea}>
                                    <textarea
                                        className={styles.inlineEditTextarea}
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className={styles.inlineEditActions}>
                                        <button
                                            type="button"
                                            className={styles.iconActionBtn}
                                            onClick={handleCancelEdit}
                                            title="Cancel"
                                        >
                                            <HiOutlineXMark />
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.iconActionBtn} ${styles.confirmEditBtn}`}
                                            onClick={() => handleSaveEdit(item.id)}
                                            title="Save"
                                        >
                                            <HiOutlineCheck />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* NORMAL VIEW */
                                <>
                                    <p className={styles.noteBody}>{item.note}</p>

                                    <div className={styles.noteFooter}>
                                        <span className={styles.noteDate}>{item.createdAt}</span>
                                        <div className={styles.cardActions}>
                                            <button
                                                type="button"
                                                className={styles.cardActionBtn}
                                                onClick={() => handleStartEdit(item)}
                                                aria-label="Edit note"
                                            >
                                                <HiOutlinePencilSquare />
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.cardActionBtn} ${styles.deleteBtn}`}
                                                onClick={() => handleDeleteNote(item.id)}
                                                aria-label="Delete note"
                                            >
                                                <HiOutlineTrash />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </BaseCard>
    );
};

export default NotesCard;