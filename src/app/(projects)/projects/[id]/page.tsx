"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
    MdArrowBack,
    MdEdit,
    MdDelete,
    MdCheckCircle,
    MdRadioButtonUnchecked,
    MdNoteAlt,
    MdChecklist,
    MdAttachMoney,
    MdDescription,
    MdAdd,
    MdClose,
    MdChevronRight,
    MdDragIndicator,
} from "react-icons/md";
import {
    HiOutlineTrash,
    HiOutlinePencilSquare,
    HiOutlineCheck,
    HiOutlineXMark,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
    ProjectItem,
    ProjectType,
    subscribeToUserProject,
    toggleUserProjectComplete,
    toggleUserProjectBilled,
    updateUserProject,
    deleteUserProject,
    ProjectNoteItem,
    subscribeToProjectNotes,
    addProjectNote,
    updateProjectNote,
    deleteProjectNote,
    ProjectTaskItem,
    subscribeToProjectTasks,
    addProjectTask,
    reorderProjectTasks,
    toggleProjectTask,
    deleteProjectTask,
} from "@/lib/fireabase/projectService";
import {
    ProjectInvoiceRecord,
    subscribeToProjectInvoices,
} from "@/lib/fireabase/projectInvoiceService";
import {
    FinanceItem,
    subscribeToUserFinanceRecords,
} from "@/lib/fireabase/financeService";
import ProjectTypeDropdown, {
    getProjectTypeConfig,
} from "../components/ProjectsCard/ProjectTypeDropdown";
import DeleteProjectModal from "../components/ProjectsCard/DeleteProjectModal";
import CustomDatePicker from "@/components/ui/CustomDatePicker/CustomDatePicker";
import styles from "./page.module.css";

const formatCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const absFormatted = Math.abs(Math.round(amount)).toLocaleString("tr-TR");
    return isNegative ? `-₺${absFormatted}` : `₺${absFormatted}`;
};

export default function ProjectDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const projectId = typeof params?.id === "string" ? params.id : "";

    const [project, setProject] = useState<ProjectItem | null>(null);
    const [loadingProject, setLoadingProject] = useState<boolean>(true);

    // Notes
    const [notes, setNotes] = useState<ProjectNoteItem[]>([]);
    const [newNoteText, setNewNoteText] = useState<string>("");
    const [addingNote, setAddingNote] = useState<boolean>(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingNoteText, setEditingNoteText] = useState<string>("");

    // Tasks & Drag re-ordering
    const [tasks, setTasks] = useState<ProjectTaskItem[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState<string>("");
    const [addingTask, setAddingTask] = useState<boolean>(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Linked Invoices & Finances
    const [invoices, setInvoices] = useState<ProjectInvoiceRecord[]>([]);
    const [finances, setFinances] = useState<FinanceItem[]>([]);

    // Edit Project Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editName, setEditName] = useState<string>("");
    const [editType, setEditType] = useState<ProjectType>("Renovation");
    const [editAgreed, setEditAgreed] = useState<string>("");
    const [editStartDate, setEditStartDate] = useState<string>("");
    const [savingProjectEdit, setSavingProjectEdit] = useState<boolean>(false);

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // Subscriptions
    useEffect(() => {
        if (!user?.uid || !projectId) {
            setLoadingProject(false);
            return;
        }

        const unsubProject = subscribeToUserProject(user.uid, projectId, (fetched) => {
            setProject(fetched);
            if (fetched) {
                setEditName(fetched.name);
                setEditType(fetched.type || "Renovation");
                setEditAgreed(fetched.agreedPayment.toString());
                setEditStartDate(fetched.startDate || format(new Date(), "yyyy-MM-dd"));
            }
            setLoadingProject(false);
        });

        const unsubNotes = subscribeToProjectNotes(user.uid, projectId, (fetchedNotes) => {
            setNotes(fetchedNotes);
        });

        const unsubTasks = subscribeToProjectTasks(user.uid, projectId, (fetchedTasks) => {
            setTasks(fetchedTasks);
        });

        const unsubInvoices = subscribeToProjectInvoices(user.uid, projectId, (fetchedInvoices) => {
            setInvoices(fetchedInvoices);
        });

        const unsubFinances = subscribeToUserFinanceRecords(user.uid, (records) => {
            setFinances(records);
        });

        return () => {
            unsubProject();
            unsubNotes();
            unsubTasks();
            unsubInvoices();
            unsubFinances();
        };
    }, [user?.uid, projectId]);

    if (loadingProject) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <span>Loading project details...</span>
            </div>
        );
    }

    if (!project) {
        return (
            <div className={styles.loadingContainer}>
                <h2>Project Not Found</h2>
                <p>This project may have been deleted or the link is invalid.</p>
                <Link href="/projects" className={styles.backBtn}>
                    <MdArrowBack /> <span>Back to Projects</span>
                </Link>
            </div>
        );
    }

    const typeConfig = getProjectTypeConfig(project.type);

    // Calculate finances linked to this project
    const linkedFinances = finances.filter(
        (r) =>
            r.catagory === "Project" &&
            (r.projectId === project.id ||
                r.explanation.trim().toLowerCase() === project.name.trim().toLowerCase())
    );
    const totalReceived = linkedFinances.reduce(
        (sum, r) => sum + (Number(r.income) || 0),
        0
    );
    const totalSpent = linkedFinances.reduce(
        (sum, r) => sum + (Number(r.expense) || 0),
        0
    );

    // If billed, invoice cut is 20%
    const billedAmount = project.isBilled ? totalReceived * 0.2 : 0;
    const effectiveReceived = totalReceived - billedAmount;
    const profit = effectiveReceived - totalSpent;
    const isProfitable = profit >= 0;

    const completionPercentage = (() => {
        if (project.agreedPayment > 0) {
            return Math.round((totalReceived / project.agreedPayment) * 100);
        }
        return project.isComplete ? 100 : 0;
    })();

    const formattedStartDate = (() => {
        if (!project.startDate) return "No date";
        try {
            return format(parseISO(project.startDate), "MMM d, yyyy");
        } catch {
            return project.startDate;
        }
    })();

    // Handlers
    const handleToggleComplete = async () => {
        if (!user?.uid) return;
        await toggleUserProjectComplete(user.uid, project.id, project.isComplete);
    };

    const handleToggleBilled = async () => {
        if (!user?.uid) return;
        await toggleUserProjectBilled(user.uid, project.id, project.isBilled);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid || !newNoteText.trim()) return;
        setAddingNote(true);
        try {
            await addProjectNote(user.uid, project.id, newNoteText.trim());
            setNewNoteText("");
        } catch (err) {
            console.error("Error adding note:", err);
        } finally {
            setAddingNote(false);
        }
    };

    const handleSaveEditNote = async (noteId: string) => {
        if (!user?.uid || !editingNoteText.trim()) return;
        try {
            await updateProjectNote(user.uid, project.id, noteId, editingNoteText.trim());
            setEditingNoteId(null);
            setEditingNoteText("");
        } catch (err) {
            console.error("Error updating note:", err);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!user?.uid) return;
        try {
            await deleteProjectNote(user.uid, project.id, noteId);
        } catch (err) {
            console.error("Error deleting note:", err);
        }
    };

    // Task handlers & Drag Re-order logic
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid || !newTaskTitle.trim()) return;
        setAddingTask(true);
        try {
            await addProjectTask(user.uid, project.id, newTaskTitle.trim(), tasks.length);
            setNewTaskTitle("");
        } catch (err) {
            console.error("Error adding task:", err);
        } finally {
            setAddingTask(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `${index}`);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const reordered = [...tasks];
        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, draggedItem);

        const updatedTasks = reordered.map((t, idx) => ({ ...t, order: idx }));
        setTasks(updatedTasks);
        setDraggedIndex(null);
        setDragOverIndex(null);

        if (user?.uid) {
            reorderProjectTasks(user.uid, project.id, updatedTasks);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        if (!user?.uid) return;
        try {
            await toggleProjectTask(user.uid, project.id, taskId, currentStatus);
        } catch (err) {
            console.error("Error toggling task:", err);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!user?.uid) return;
        try {
            await deleteProjectTask(user.uid, project.id, taskId);
        } catch (err) {
            console.error("Error deleting task:", err);
        }
    };

    const handleSaveProjectDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid || !editName.trim()) return;
        setSavingProjectEdit(true);
        try {
            await updateUserProject(user.uid, project.id, {
                name: editName.trim(),
                type: editType,
                agreedPayment: Number(editAgreed) || 0,
                startDate: editStartDate,
            });
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Error updating project details:", err);
        } finally {
            setSavingProjectEdit(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!user?.uid) return;
        setIsDeleting(true);
        try {
            await deleteUserProject(user.uid, project.id);
            router.push("/projects");
        } catch (err) {
            console.error("Error deleting project:", err);
            setIsDeleting(false);
        }
    };

    const completedTasksCount = tasks.filter((t) => t.isCompleted).length;

    return (
        <div className={styles.container}>
            {/* TOP BAR / NAVIGATION */}
            <div className={styles.topBar}>
                <Link href="/projects" className={styles.backBtn}>
                    <MdArrowBack /> <span>All Projects</span>
                </Link>

                <div className={styles.topActions}>
                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <MdEdit /> <span>Edit Details</span>
                    </button>
                    <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        <MdDelete /> <span>Delete Project</span>
                    </button>
                </div>
            </div>

            {/* HEADER CARD */}
            <div className={styles.headerCard}>
                <div className={styles.titleArea}>
                    <div className={styles.titleLeft}>
                        <div className={styles.projectTitleRow}>
                            <h1
                                className={`${styles.projectName} ${
                                    project.isComplete ? styles.projectNameStriked : ""
                                }`}
                            >
                                {project.name}
                            </h1>
                        </div>

                        <div className={styles.badgeRow}>
                            <span
                                className={styles.typeBadge}
                                style={{
                                    color: typeConfig.color,
                                    backgroundColor: typeConfig.bg,
                                    border: `1px solid ${typeConfig.border}`,
                                }}
                            >
                                {typeConfig.icon}
                                <span>{typeConfig.label}</span>
                            </span>

                            <button
                                type="button"
                                className={`${styles.statusToggleBtn} ${
                                    project.isComplete ? styles.statusCompleted : styles.statusActive
                                }`}
                                onClick={handleToggleComplete}
                                title="Click to toggle status"
                            >
                                {project.isComplete ? (
                                    <>
                                        <MdCheckCircle /> Completed
                                    </>
                                ) : (
                                    <>
                                        <MdRadioButtonUnchecked /> Active Project
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className={`${styles.billingToggleBtn} ${
                                    project.isBilled ? styles.billingActive : styles.billingInactive
                                }`}
                                onClick={handleToggleBilled}
                                title="Click to toggle billing"
                            >
                                {project.isBilled ? "Billed (20% Cut)" : "Not Billed"}
                            </button>

                            <span className={styles.dateInfo}>
                                Started: {formattedStartDate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* PROGRESS BAR */}
                <div className={styles.progressSection}>
                    <div className={styles.progressLabelRow}>
                        <span>Payment & Milestone Progress</span>
                        <span className={styles.progressPercentage}>
                            {completionPercentage}% paid
                        </span>
                    </div>
                    <div className={styles.progressBarTrack}>
                        <div
                            className={`${styles.progressBarFill} ${
                                project.isComplete ? styles.progressCompletedFill : ""
                            }`}
                            style={{
                                width: `${Math.min(Math.max(completionPercentage, 0), 100)}%`,
                            }}
                        />
                    </div>
                </div>

                {/* FINANCIAL STATS GRID */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Agreed Amount</span>
                        <span className={styles.statValue}>
                            {formatCurrency(project.agreedPayment)}
                        </span>
                        <span className={styles.statSubtext}>Target contract price</span>
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Total Received</span>
                        <span className={`${styles.statValue} ${styles.statReceived}`}>
                            {formatCurrency(totalReceived)}
                        </span>
                        <span className={styles.statSubtext}>
                            {project.agreedPayment > 0
                                ? `${completionPercentage}% of agreed`
                                : "Income records"}
                        </span>
                    </div>

                    {project.isBilled && (
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>Billed Cut (20%)</span>
                            <span className={`${styles.statValue} ${styles.statSpent}`}>
                                -{formatCurrency(billedAmount)}
                            </span>
                            <span className={styles.statSubtext}>Tax/invoice deduction</span>
                        </div>
                    )}

                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Total Spent</span>
                        <span className={`${styles.statValue} ${styles.statSpent}`}>
                            {formatCurrency(totalSpent)}
                        </span>
                        <span className={styles.statSubtext}>Linked expense items</span>
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Net Profit</span>
                        <span
                            className={`${styles.statValue} ${
                                isProfitable ? styles.statProfitPos : styles.statProfitNeg
                            }`}
                        >
                            {isProfitable && profit > 0 ? "+" : ""}
                            {formatCurrency(profit)}
                        </span>
                        <span className={styles.statSubtext}>
                            {totalReceived > 0
                                ? `${Math.round((profit / totalReceived) * 100)}% net margin`
                                : "After expenses"}
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className={styles.dashboardGrid}>
                {/* LEFT COLUMN: PROJECT NOTES */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitleGroup}>
                            <MdNoteAlt className={styles.sectionIcon} />
                            <h2 className={styles.sectionTitle}>Project Notes & Logs</h2>
                        </div>
                        <span className={styles.countBadge}>{notes.length} notes</span>
                    </div>

                    {/* ADD NEW NOTE */}
                    <form className={styles.addNoteForm} onSubmit={handleAddNote}>
                        <textarea
                            className={styles.noteTextarea}
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            placeholder="Add a new dated note, meeting record, revision request, or update..."
                            rows={3}
                        />
                        <button
                            type="submit"
                            className={styles.addNoteBtn}
                            disabled={addingNote || !newNoteText.trim()}
                        >
                            <MdAdd size={16} /> <span>{addingNote ? "Adding..." : "Add Note"}</span>
                        </button>
                    </form>

                    {/* NOTES LIST */}
                    <div className={styles.notesList}>
                        {notes.length === 0 ? (
                            <div className={styles.emptyState}>
                                <MdNoteAlt className={styles.emptyStateIcon} />
                                <span className={styles.emptyStateText}>
                                    No notes added yet for this project. Keep records of meetings, client feedback, or tasks above.
                                </span>
                            </div>
                        ) : (
                            notes.map((item) => (
                                <div key={item.id} className={styles.noteItem}>
                                    <div className={styles.noteHeader}>
                                        <span className={styles.noteDate}>{item.createdAt}</span>
                                        <div className={styles.noteActions}>
                                            {editingNoteId !== item.id && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className={styles.noteActionBtn}
                                                        onClick={() => {
                                                            setEditingNoteId(item.id);
                                                            setEditingNoteText(item.note);
                                                        }}
                                                        title="Edit note"
                                                    >
                                                        <HiOutlinePencilSquare size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`${styles.noteActionBtn} ${styles.noteDeleteBtn}`}
                                                        onClick={() => handleDeleteNote(item.id)}
                                                        title="Delete note"
                                                    >
                                                        <HiOutlineTrash size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {editingNoteId === item.id ? (
                                        <div>
                                            <textarea
                                                className={styles.editNoteTextarea}
                                                value={editingNoteText}
                                                onChange={(e) => setEditingNoteText(e.target.value)}
                                                rows={3}
                                            />
                                            <div className={styles.editNoteActions}>
                                                <button
                                                    type="button"
                                                    className={styles.saveEditBtn}
                                                    onClick={() => handleSaveEditNote(item.id)}
                                                >
                                                    <HiOutlineCheck size={14} /> Save
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.cancelEditBtn}
                                                    onClick={() => setEditingNoteId(null)}
                                                >
                                                    <HiOutlineXMark size={14} /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className={styles.noteContent}>{item.note}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: TASKS / CHECKLIST + PROPOSALS + FINANCES */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* CHECKLIST / TASKS */}
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitleGroup}>
                                <MdChecklist className={styles.sectionIcon} />
                                <h2 className={styles.sectionTitle}>Project Checklist & Milestones</h2>
                            </div>
                            <span className={styles.countBadge}>
                                {completedTasksCount} / {tasks.length} done
                            </span>
                        </div>

                        {/* ADD TASK */}
                        <form className={styles.addTaskRow} onSubmit={handleAddTask}>
                            <input
                                type="text"
                                className={styles.taskInput}
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Add project milestone or task..."
                            />
                            <button
                                type="submit"
                                className={styles.addTaskBtn}
                                disabled={addingTask || !newTaskTitle.trim()}
                            >
                                <MdAdd size={16} /> <span>Add</span>
                            </button>
                        </form>

                        {/* TASKS LIST WITH DRAG AND DROP */}
                        <div className={styles.taskList}>
                            {tasks.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <MdChecklist className={styles.emptyStateIcon} />
                                    <span className={styles.emptyStateText}>
                                        No milestones yet. Track project steps, drawings, revisions, and deliveries.
                                    </span>
                                </div>
                            ) : (
                                tasks.map((task, index) => (
                                    <div
                                        key={task.id}
                                        className={`${styles.taskItem} ${
                                            draggedIndex === index ? styles.taskItemDragging : ""
                                        } ${dragOverIndex === index ? styles.taskItemDragOver : ""}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className={styles.dragHandle} title="Drag to reorder">
                                            <MdDragIndicator size={16} />
                                        </div>
                                        <div
                                            className={styles.taskLeft}
                                            onClick={() => handleToggleTask(task.id, task.isCompleted)}
                                        >
                                            {task.isCompleted ? (
                                                <MdCheckCircle
                                                    className={`${styles.taskCheckIcon} ${styles.taskCheckIconCompleted}`}
                                                />
                                            ) : (
                                                <MdRadioButtonUnchecked className={styles.taskCheckIcon} />
                                            )}
                                            <span
                                                className={`${styles.taskTitle} ${
                                                    task.isCompleted ? styles.taskTitleCompleted : ""
                                                }`}
                                            >
                                                {task.title}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.taskDeleteBtn}
                                            onClick={() => handleDeleteTask(task.id)}
                                            title="Delete task"
                                        >
                                            <HiOutlineTrash size={15} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* LINKED PROPOSALS & INVOICES */}
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitleGroup}>
                                <MdDescription className={styles.sectionIcon} />
                                <h2 className={styles.sectionTitle}>Saved Proposals & Invoices</h2>
                            </div>
                            <span className={styles.countBadge}>{invoices.length}</span>
                        </div>

                        <div className={styles.invoiceList}>
                            {invoices.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <MdDescription className={styles.emptyStateIcon} />
                                    <span className={styles.emptyStateText}>
                                        No proposals linked to this project yet. Create proposals in the Proposals section.
                                    </span>
                                </div>
                            ) : (
                                invoices.map((inv) => (
                                    <Link
                                        key={inv.id}
                                        href={`/proposals?projectId=${project.id}&invoiceId=${inv.id}`}
                                        className={styles.invoiceItem}
                                        title={`Open "${inv.name}" in Proposals`}
                                    >
                                        <div className={styles.invoiceInfo}>
                                            <span className={styles.invoiceName}>{inv.name}</span>
                                            <span className={styles.invoiceSub}>
                                                #{inv.invoiceNumber} • {inv.itemCount} items
                                            </span>
                                        </div>
                                        <div className={styles.invoiceItemRight}>
                                            <span className={styles.invoiceAmount}>₺{inv.totalAmount}</span>
                                            <MdChevronRight size={18} className={styles.invoiceChevron} />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* LINKED FINANCIAL TRANSACTIONS */}
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitleGroup}>
                                <MdAttachMoney className={styles.sectionIcon} />
                                <h2 className={styles.sectionTitle}>Linked Financial Records</h2>
                            </div>
                            <span className={styles.countBadge}>{linkedFinances.length}</span>
                        </div>

                        <div className={styles.financesList}>
                            {linkedFinances.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <MdAttachMoney className={styles.emptyStateIcon} />
                                    <span className={styles.emptyStateText}>
                                        No finance entries linked with this project name yet.
                                    </span>
                                </div>
                            ) : (
                                linkedFinances.map((f) => (
                                    <div key={f.id} className={styles.financeItem}>
                                        <span className={styles.financeDesc}>{f.explanation}</span>
                                        {Number(f.income) > 0 ? (
                                            <span className={styles.financeIncome}>
                                                +{formatCurrency(Number(f.income))}
                                            </span>
                                        ) : (
                                            <span className={styles.financeExpense}>
                                                -{formatCurrency(Number(f.expense))}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT PROJECT DETAILS MODAL */}
            {isEditModalOpen && (
                <div
                    className={styles.modalBackdrop}
                    onClick={() => setIsEditModalOpen(false)}
                >
                    <div
                        className={styles.modalBox}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Edit Project Details</h3>
                            <button
                                type="button"
                                className={styles.modalCloseBtn}
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                <MdClose size={18} />
                            </button>
                        </div>

                        <form className={styles.modalForm} onSubmit={handleSaveProjectDetails}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Project Name</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Project Type</label>
                                <ProjectTypeDropdown value={editType} onChange={setEditType} />
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Start Date</label>
                                <CustomDatePicker
                                    value={editStartDate}
                                    onChange={setEditStartDate}
                                />
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Agreed Amount (₺)</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    value={editAgreed}
                                    onChange={(e) => setEditAgreed(e.target.value)}
                                />
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.modalCancelBtn}
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.modalSubmitBtn}
                                    disabled={savingProjectEdit}
                                >
                                    {savingProjectEdit ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE PROJECT CONFIRMATION MODAL */}
            <DeleteProjectModal
                isOpen={isDeleteModalOpen}
                project={project}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}
