"use client";

import React, { useState, useEffect } from "react";
import BaseCard from "@/components/ui/BaseCard/BaseCard";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import {
    MdAdd,
    MdTune,
    MdClose,
    MdWorkOutline,
    MdCheckCircleOutline,
} from "react-icons/md";
import {
    ProjectItem,
    ProjectType,
    subscribeToUserProjects,
    addProjectToUser,
    toggleUserProjectComplete,
    toggleUserProjectBilled,
    updateUserProject,
    deleteUserProject,
} from "@/lib/fireabase/projectService";
import {
    FinanceItem,
    subscribeToUserFinanceRecords,
} from "@/lib/fireabase/financeService";
import ProjectItemCard from "./ProjectItemCard";
import CustomDatePicker from "@/components/ui/CustomDatePicker/CustomDatePicker";
import ProjectTypeDropdown from "./ProjectTypeDropdown";
import DeleteProjectModal from "./DeleteProjectModal";
import styles from "./ProjectsCard.module.css";

const ProjectsCard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [financeRecords, setFinanceRecords] = useState<FinanceItem[]>([]);
    const [loading, setLoading] = useState<boolean>(Boolean(user?.uid));

    // Form states
    const [projectName, setProjectName] = useState<string>("");
    const [projectType, setProjectType] = useState<ProjectType>("Renovation");
    const [agreedPayment, setAgreedPayment] = useState<string>("");
    const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const [isBilled, setIsBilled] = useState<boolean>(false);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Delete confirmation state
    const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // Real-time Firestore subscriptions
    useEffect(() => {
        if (!user?.uid) {
            setProjects([]);
            setFinanceRecords([]);
            setLoading(false);
            return;
        }

        const unsubProjects = subscribeToUserProjects(user.uid, (fetchedProjects) => {
            setProjects(fetchedProjects);
            setLoading(false);
        });

        const unsubFinances = subscribeToUserFinanceRecords(user.uid, (fetchedRecords) => {
            setFinanceRecords(fetchedRecords);
        });

        return () => {
            unsubProjects();
            unsubFinances();
        };
    }, [user?.uid]);

    // When user logs out or is not present, displayed list is empty; otherwise compute totals from Finance records
    const currentProjects = user
        ? projects.map((project) => {
              const linkedFinances = financeRecords.filter(
                  (r) =>
                      r.catagory === "Project" &&
                      (r.projectId === project.id ||
                          r.explanation.trim().toLowerCase() === project.name.trim().toLowerCase())
              );
              const calculatedReceived = linkedFinances.reduce(
                  (sum, r) => sum + (Number(r.income) || 0),
                  0
              );
              const calculatedSpent = linkedFinances.reduce(
                  (sum, r) => sum + (Number(r.expense) || 0),
                  0
              );

              return {
                  ...project,
                  totalMoneyReceived: calculatedReceived,
                  totalMoneySpent: calculatedSpent,
              };
          })
        : [];
    const isLoading = user ? loading : false;

    // Derived project lists
    const activeProjects = currentProjects.filter((p) => !p.isComplete);
    const completedProjects = currentProjects.filter((p) => p.isComplete);

    // Add project handler (received and spent start at 0 and derive strictly from finance records)
    const handleAddProject = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user?.uid || !projectName.trim() || submitting) return;

        setSubmitting(true);
        try {
            await addProjectToUser(user.uid, {
                name: projectName.trim(),
                type: projectType,
                startDate: startDate || format(new Date(), "yyyy-MM-dd"),
                agreedPayment: Number(agreedPayment) || 0,
                totalMoneyReceived: 0,
                totalMoneySpent: 0,
                isBilled: isBilled,
                isComplete: false,
            });

            // Reset inputs
            setProjectName("");
            setProjectType("Renovation");
            setAgreedPayment("");
            setIsBilled(false);
            setShowAdvanced(false);
        } catch (error) {
            console.error("Error creating project:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !showAdvanced) {
            e.preventDefault();
            handleAddProject();
        }
    };

    const handleToggleComplete = async (id: string, currentStatus: boolean) => {
        if (!user?.uid) return;
        try {
            await toggleUserProjectComplete(user.uid, id, currentStatus);
        } catch (error) {
            console.error("Error toggling completion:", error);
        }
    };

    const handleToggleBilled = async (id: string, currentStatus: boolean) => {
        if (!user?.uid) return;
        try {
            await toggleUserProjectBilled(user.uid, id, currentStatus);
        } catch (error) {
            console.error("Error toggling billing:", error);
        }
    };

    const handleUpdateProject = async (id: string, updates: Partial<ProjectItem>) => {
        if (!user?.uid) return;
        try {
            await updateUserProject(user.uid, id, updates);
        } catch (error) {
            console.error("Error updating project:", error);
        }
    };

    const handleRequestDelete = (id: string) => {
        const target = currentProjects.find((p) => p.id === id);
        if (target) {
            setProjectToDelete(target);
        }
    };

    const handleConfirmDelete = async (id: string) => {
        if (!user?.uid) return;
        setIsDeleting(true);
        try {
            await deleteUserProject(user.uid, id);
            setProjectToDelete(null);
        } catch (error) {
            console.error("Error deleting project:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <BaseCard className={styles.projectsCardContainer}>
            {/* HEADER AREA */}
            <div className={styles.headerArea}>
                <div className={styles.titleWrapper}>
                    <MdWorkOutline className={styles.headerIcon} />
                    <h3 className={styles.sectionTitle}>Projects</h3>
                </div>
                <span className={styles.activeProjectCount}>
                    {isLoading ? "..." : `${activeProjects.length} Active`}
                </span>
            </div>

            {/* ADD PROJECTS INPUT / FORM */}
            <form className={styles.addProjectForm} onSubmit={handleAddProject}>
                <div className={styles.primaryInputRow}>
                    <input
                        type="text"
                        placeholder={user ? "Add a new project..." : "Sign in to add projects"}
                        className={styles.projectInput}
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!user || submitting}
                    />

                    <button
                        type="button"
                        className={`${styles.filterToggleBtn} ${showAdvanced ? styles.filterToggleActive : ""}`}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        title={showAdvanced ? "Hide details" : "Add type, date & financial details"}
                        disabled={!user || submitting}
                        aria-label="Toggle details"
                    >
                        {showAdvanced ? <MdClose className={styles.filterToggleIcon} /> : <MdTune className={styles.filterToggleIcon} />}
                    </button>

                    <button
                        type="submit"
                        className={styles.addSubmitButton}
                        disabled={!user || !projectName.trim() || submitting}
                        title="Add project"
                        aria-label="Add project"
                    >
                        <MdAdd />
                    </button>
                </div>

                {/* EXPANDABLE FINANCIAL & DATE INPUTS */}
                {showAdvanced && (
                    <div className={styles.advancedFieldsContainer}>
                        <div className={styles.advancedGrid}>
                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>Project Type</label>
                                <ProjectTypeDropdown value={projectType} onChange={setProjectType} />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>Start Date</label>
                                <CustomDatePicker value={startDate} onChange={setStartDate} />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.fieldLabel}>Agreed Payment (₺)</label>
                                <div className={styles.currencyInputWrapper}>
                                    <span className={styles.currencySymbol}>₺</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        step="any"
                                        className={styles.subInputWithSymbol}
                                        value={agreedPayment}
                                        onChange={(e) => setAgreedPayment(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.advancedBottomBar}>
                            {/* Custom styled switch slider replacing standard HTML checkbox */}
                            <label className={styles.switchLabel}>
                                <div className={styles.switchContainer}>
                                    <input
                                        type="checkbox"
                                        checked={isBilled}
                                        onChange={(e) => setIsBilled(e.target.checked)}
                                        className={styles.switchInput}
                                    />
                                    <span className={styles.switchSlider} />
                                </div>
                                <span className={styles.switchTitle}>Mark as Billed / Proposals</span>
                            </label>

                            <button
                                type="submit"
                                className={styles.createProjectBtn}
                                disabled={!projectName.trim() || submitting}
                            >
                                <MdAdd /> Create Project
                            </button>
                        </div>
                    </div>
                )}
            </form>

            {/* PROJECTS LIST CONTAINER */}
            <div className={styles.listContainer}>
                {isLoading && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner} />
                        <span>Loading projects...</span>
                    </div>
                )}

                {/* ACTIVE PROJECTS */}
                {!isLoading && activeProjects.length > 0 && (
                    <div className={styles.projectGroup}>
                        <div className={styles.groupHeader}>
                            <span className={styles.groupLabel}>Active Projects</span>
                            <span className={styles.groupBadge}>{activeProjects.length}</span>
                        </div>
                        <ul className={styles.projectsList}>
                            {activeProjects.map((project) => (
                                <ProjectItemCard
                                    key={project.id}
                                    project={project}
                                    onToggleComplete={handleToggleComplete}
                                    onToggleBilled={handleToggleBilled}
                                    onUpdate={handleUpdateProject}
                                    onDelete={handleRequestDelete}
                                />
                            ))}
                        </ul>
                    </div>
                )}

                {/* COMPLETED PROJECTS */}
                {!isLoading && completedProjects.length > 0 && (
                    <div className={styles.projectGroup}>
                        <div className={styles.groupHeader}>
                            <div className={styles.completedHeaderTitle}>
                                <MdCheckCircleOutline className={styles.completedIcon} />
                                <span className={styles.groupLabel}>Completed</span>
                            </div>
                            <span className={styles.groupBadge}>{completedProjects.length}</span>
                        </div>
                        <ul className={styles.projectsList}>
                            {completedProjects.map((project) => (
                                <ProjectItemCard
                                    key={project.id}
                                    project={project}
                                    onToggleComplete={handleToggleComplete}
                                    onToggleBilled={handleToggleBilled}
                                    onUpdate={handleUpdateProject}
                                    onDelete={handleRequestDelete}
                                />
                            ))}
                        </ul>
                    </div>
                )}

                {/* EMPTY STATE */}
                {!isLoading && currentProjects.length === 0 && (
                    <div className={styles.emptyState}>
                        <MdWorkOutline className={styles.emptyIcon} />
                        <h4>No projects yet</h4>
                        <p>Track payments, expenses, profit, and milestones by adding a project above.</p>
                    </div>
                )}
            </div>

            {/* CUSTOM DELETE CONFIRMATION ALERT MODAL */}
            <DeleteProjectModal
                isOpen={Boolean(projectToDelete)}
                project={projectToDelete}
                onClose={() => !isDeleting && setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </BaseCard>
    );
};

export default ProjectsCard;
