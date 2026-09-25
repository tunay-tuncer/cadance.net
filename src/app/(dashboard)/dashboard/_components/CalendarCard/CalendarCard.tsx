'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import BaseCard from '@/components/ui/BaseCard/BaseCard';
import CustomDatePicker from '@/components/ui/CustomDatePicker/CustomDatePicker';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect/CustomSelect';
import {
    CalendarEvent,
    subscribeToUserEvents,
    addEventToUser,
    deleteUserEvent,
    updateUserEvent,
    addBatchEventsToUser,
} from '@/lib/fireabase/calendarService';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addDays,
    addWeeks,
    addYears,
    parseISO,
    isValid,
} from 'date-fns';

// REACT ICONS
import { FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";
import { MdDelete, MdEvent, MdDirectionsRun, MdCall, MdPayment, MdEdit, MdRepeat } from "react-icons/md";

// STYLES
import styles from "./CalendarCard.module.css";

interface EventTypeOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    colorId: string;
}

type DetailPanelMode = 'add' | 'edit' | 'repeat';

const REPEAT_PRESETS: SelectOption[] = [
    { value: 'weekly_4', label: 'Every week for 4 weeks', subtext: '4 weekly repeats' },
    { value: 'weekly_8', label: 'Every week for 8 weeks', subtext: '8 weekly repeats' },
    { value: 'weekly_12', label: 'Every week for 12 weeks', subtext: '12 weekly repeats' },
    { value: 'biweekly_4', label: 'Every 2 weeks for 8 weeks', subtext: '4 bi-weekly repeats' },
    { value: 'monthly_3', label: 'Every month for 3 months', subtext: '3 monthly repeats' },
    { value: 'monthly_6', label: 'Every month for 6 months', subtext: '6 monthly repeats' },
    { value: 'monthly_12', label: 'Every month for 12 months', subtext: '12 monthly repeats (1 year)' },
    { value: 'daily_7', label: 'Every day for 7 days', subtext: '7 consecutive days' },
    { value: 'daily_14', label: 'Every day for 14 days', subtext: '14 consecutive days' },
    { value: 'yearly_2', label: 'Every year for 2 years', subtext: '2 annual repeats' },
    { value: 'custom', label: 'Custom schedule...', subtext: 'Configure custom repeat' },
];

const FREQUENCY_OPTIONS: SelectOption[] = [
    { value: 'daily', label: 'Day(s)' },
    { value: 'weekly', label: 'Week(s)' },
    { value: 'monthly', label: 'Month(s)' },
    { value: 'yearly', label: 'Year(s)' },
];

export default function CalendarCard() {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const { selectedDate, setSelectedDate } = useProjectContext();
    const [zoomDay, setZoomDay] = useState<Date | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    // Detail Panel Mode: 'add' | 'edit' | 'repeat'
    const [panelMode, setPanelMode] = useState<DetailPanelMode>('add');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Add Form State
    const [newEventTitle, setNewEventTitle] = useState<string>("");
    const [eventType, setEventType] = useState<string>("standard");
    const [eventColorId, setEventColorId] = useState<string>("9");
    const [isRepeatActive, setIsRepeatActive] = useState<boolean>(false);
    const [addRepeatPreset, setAddRepeatPreset] = useState<string>('weekly_4');

    // Edit Form State
    const [editTitle, setEditTitle] = useState<string>("");
    const [editDate, setEditDate] = useState<string>("");
    const [editType, setEditType] = useState<string>("standard");
    const [editColorId, setEditColorId] = useState<string>("9");

    // Repeat Form State
    const [repeatPreset, setRepeatPreset] = useState<string>('weekly_4');
    const [customFrequency, setCustomFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
    const [customInterval, setCustomInterval] = useState<number>(1);
    const [customCount, setCustomCount] = useState<number>(4);

    useEffect(() => {
        if (!user?.uid) {
            setEvents([]);
            return;
        }

        const unsubscribe = subscribeToUserEvents(user.uid, (fetchedEvents) => {
            setEvents(fetchedEvents);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        setSelectedDate(format(today, 'yyyy-MM-dd'));
    };

    const eventTypes: EventTypeOption[] = [
        { id: "standard", label: "Standard Event", icon: <MdEvent size={16} />, colorId: "9" },
        { id: "toGo", label: "To Go", icon: <MdDirectionsRun size={16} />, colorId: "5" },
        { id: "call", label: "Call", icon: <MdCall size={16} />, colorId: "2" },
        { id: "payment", label: "Payment", icon: <MdPayment size={16} />, colorId: "11" }
    ];

    const googleColors: Record<string, string> = {
        "9": "#5484ed", // Blue - Standard Event
        "5": "#f6bf26", // Yellow - To Go
        "2": "#22c55e", // Green - Call
        "11": "#ef4444", // Red - Payment
        // Backward compatibility
        "1": "#a4bdfc",
        "4": "#ef4444",
        "7": "#46d6db"
    };

    const getEventTypeIcon = (typeId?: string) => {
        switch (typeId) {
            case "toGo":
                return <MdDirectionsRun size={15} style={{ color: "#f6bf26" }} />;
            case "call":
                return <MdCall size={15} style={{ color: "#22c55e" }} />;
            case "payment":
                return <MdPayment size={15} style={{ color: "#ef4444" }} />;
            default:
                return <MdEvent size={15} style={{ color: "#5484ed" }} />;
        }
    };

    const calculatePresetDates = (baseDateStr: string, preset: string): string[] => {
        try {
            const baseDate = parseISO(baseDateStr);
            if (!isValid(baseDate)) return [];

            let freq: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' = 'weekly';
            let interval = 1;
            let count = 4;

            if (preset === 'weekly_4') { freq = 'weekly'; interval = 1; count = 4; }
            else if (preset === 'weekly_8') { freq = 'weekly'; interval = 1; count = 8; }
            else if (preset === 'weekly_12') { freq = 'weekly'; interval = 1; count = 12; }
            else if (preset === 'biweekly_4') { freq = 'biweekly'; interval = 2; count = 4; }
            else if (preset === 'monthly_3') { freq = 'monthly'; interval = 1; count = 3; }
            else if (preset === 'monthly_6') { freq = 'monthly'; interval = 1; count = 6; }
            else if (preset === 'monthly_12') { freq = 'monthly'; interval = 1; count = 12; }
            else if (preset === 'daily_7') { freq = 'daily'; interval = 1; count = 7; }
            else if (preset === 'daily_14') { freq = 'daily'; interval = 1; count = 14; }
            else if (preset === 'yearly_2') { freq = 'yearly'; interval = 1; count = 2; }

            const result: string[] = [];
            for (let i = 1; i <= count; i++) {
                let nextDate: Date;
                if (freq === 'daily') nextDate = addDays(baseDate, i * interval);
                else if (freq === 'monthly') nextDate = addMonths(baseDate, i * interval);
                else if (freq === 'yearly') nextDate = addYears(baseDate, i * interval);
                else nextDate = addWeeks(baseDate, i * interval);
                result.push(format(nextDate, 'yyyy-MM-dd'));
            }
            return result;
        } catch {
            return [];
        }
    };

    // Live preview of repeated dates
    const repeatGeneratedDates = useMemo<string[]>(() => {
        if (!selectedEvent?.date) return [];
        try {
            const baseDate = parseISO(selectedEvent.date);
            if (!isValid(baseDate)) return [];

            let freq: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' = 'weekly';
            let interval = 1;
            let count = 4;

            if (repeatPreset === 'custom') {
                freq = customFrequency;
                interval = Math.max(1, Math.min(customInterval || 1, 12));
                count = Math.max(1, Math.min(customCount || 1, 52));
            } else {
                if (repeatPreset === 'weekly_4') { freq = 'weekly'; interval = 1; count = 4; }
                else if (repeatPreset === 'weekly_8') { freq = 'weekly'; interval = 1; count = 8; }
                else if (repeatPreset === 'weekly_12') { freq = 'weekly'; interval = 1; count = 12; }
                else if (repeatPreset === 'biweekly_4') { freq = 'biweekly'; interval = 2; count = 4; }
                else if (repeatPreset === 'monthly_3') { freq = 'monthly'; interval = 1; count = 3; }
                else if (repeatPreset === 'monthly_6') { freq = 'monthly'; interval = 1; count = 6; }
                else if (repeatPreset === 'monthly_12') { freq = 'monthly'; interval = 1; count = 12; }
                else if (repeatPreset === 'daily_7') { freq = 'daily'; interval = 1; count = 7; }
                else if (repeatPreset === 'daily_14') { freq = 'daily'; interval = 1; count = 14; }
                else if (repeatPreset === 'yearly_2') { freq = 'yearly'; interval = 1; count = 2; }
            }

            const dates: string[] = [];
            for (let i = 1; i <= count; i++) {
                let nextDate: Date;
                if (freq === 'daily') nextDate = addDays(baseDate, i * interval);
                else if (freq === 'monthly') nextDate = addMonths(baseDate, i * interval);
                else if (freq === 'yearly') nextDate = addYears(baseDate, i * interval);
                else nextDate = addWeeks(baseDate, i * interval);
                dates.push(format(nextDate, 'yyyy-MM-dd'));
            }
            return dates;
        } catch {
            return [];
        }
    }, [selectedEvent?.date, repeatPreset, customFrequency, customInterval, customCount]);

    // Handle Add New Event
    const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newEventTitle.trim() || !zoomDay || !user?.uid) return;

        const title = newEventTitle.trim();
        const baseDateStr = format(zoomDay, 'yyyy-MM-dd');
        setNewEventTitle("");

        setIsSubmitting(true);
        try {
            await addEventToUser(user.uid, {
                title,
                date: baseDateStr,
                colorId: eventColorId,
                type: eventType,
            });

            if (isRepeatActive) {
                const repeatedDates = calculatePresetDates(baseDateStr, addRepeatPreset);
                if (repeatedDates.length > 0) {
                    const batchItems = repeatedDates.map((d) => ({
                        title,
                        date: d,
                        colorId: eventColorId,
                        type: eventType,
                    }));
                    await addBatchEventsToUser(user.uid, batchItems);
                }
            }
        } catch (error) {
            console.error("Event ekleme hatası:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Start Edit
    const handleStartEdit = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setEditTitle(event.title);
        setEditDate(event.date);
        setEditType(event.type || 'standard');
        setEditColorId(event.colorId || '9');
        setPanelMode('edit');
    };

    // Handle Save Edit
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid || !selectedEvent || !editTitle.trim() || !editDate) return;

        setIsSubmitting(true);
        try {
            await updateUserEvent(user.uid, selectedEvent.id, {
                title: editTitle.trim(),
                date: editDate,
                colorId: editColorId,
                type: editType,
            });
            setPanelMode('add');
            setSelectedEvent(null);
        } catch (error) {
            console.error('Event update error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Start Repeat
    const handleStartRepeat = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setRepeatPreset('weekly_4');
        setCustomFrequency('weekly');
        setCustomInterval(1);
        setCustomCount(4);
        setPanelMode('repeat');
    };

    // Handle Execute Repeat
    const handleExecuteRepeat = async () => {
        if (!user?.uid || !selectedEvent || repeatGeneratedDates.length === 0) return;

        setIsSubmitting(true);
        try {
            const batchItems = repeatGeneratedDates.map((dateStr) => ({
                title: selectedEvent.title,
                date: dateStr,
                colorId: selectedEvent.colorId || '9',
                type: selectedEvent.type || 'standard',
            }));

            await addBatchEventsToUser(user.uid, batchItems);
            setPanelMode('add');
            setSelectedEvent(null);
        } catch (error) {
            console.error('Event repeat error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelPanel = () => {
        setPanelMode('add');
        setSelectedEvent(null);
    };

    const handleDeleteEvent = async (clickedId: string | number) => {
        if (!user?.uid) return;
        try {
            await deleteUserEvent(user.uid, String(clickedId));
            if (selectedEvent?.id === String(clickedId)) {
                handleCancelPanel();
            }
        } catch (error) {
            console.error("Event silme hatası:", error);
        }
    };

    const handleZoomClick = (e: React.MouseEvent<HTMLButtonElement>, day: Date) => {
        e.stopPropagation();
        setZoomDay(day);
        setSelectedDate(format(day, 'yyyy-MM-dd'));
        setPanelMode('add');
        setSelectedEvent(null);
    };

    const handleDaySelect = (day: Date) => {
        setSelectedDate(format(day, 'yyyy-MM-dd'));
    };

    return (
        <BaseCard className={styles.calendarCard}>
            {zoomDay ? (
                /* Detay Görünümü */
                <div className={styles.detailContainer}>
                    <div className={styles.header}>
                        <h3 className={styles.monthTitle}>
                            {format(zoomDay, 'eeee, MMMM d, yyyy')}
                        </h3>
                        <button
                            onClick={() => {
                                setZoomDay(null);
                                handleCancelPanel();
                            }}
                            className={styles.actionBtn}
                        >
                            Back to Calendar
                        </button>
                    </div>

                    <div className={styles.detailViewBody}>
                        {/* LEFT COLUMN: EVENTS LIST */}
                        <div className={styles.detailEventsSection}>
                            <h4>Events ({events.filter(e => e.date === format(zoomDay, 'yyyy-MM-dd')).length})</h4>
                            {events.filter(e => e.date === format(zoomDay, 'yyyy-MM-dd')).length === 0 ? (
                                <p className={styles.noEventsText}>No events scheduled for this day.</p>
                            ) : (
                                <div className={styles.detailEventsList}>
                                    {events
                                        .filter(e => e.date === format(zoomDay, 'yyyy-MM-dd'))
                                        .map((event) => {
                                            const isBeingEdited = panelMode === 'edit' && selectedEvent?.id === event.id;
                                            const isBeingRepeated = panelMode === 'repeat' && selectedEvent?.id === event.id;

                                            return (
                                                <div
                                                    key={event.id}
                                                    className={`
                                                        ${styles.detailEventItem}
                                                        ${isBeingEdited ? styles.activeItemHighlightEdit : ''}
                                                        ${isBeingRepeated ? styles.activeItemHighlightRepeat : ''}
                                                    `}
                                                    style={{ borderLeft: `3px solid ${googleColors[event.colorId] || '#5484ed'}` }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                        {getEventTypeIcon(event.type)}
                                                        <span className={styles.detailEventTitle} title={event.title}>{event.title}</span>
                                                    </div>
                                                    <div className={styles.itemActions}>
                                                        <button
                                                            type="button"
                                                            className={`${styles.actionIconButton} ${styles.repeatBtn}`}
                                                            onClick={() => handleStartRepeat(event)}
                                                            title="Repeat event"
                                                            aria-label="Repeat event"
                                                        >
                                                            <MdRepeat size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`${styles.actionIconButton} ${styles.editBtn}`}
                                                            onClick={() => handleStartEdit(event)}
                                                            title="Edit event"
                                                            aria-label="Edit event"
                                                        >
                                                            <MdEdit size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`${styles.actionIconButton} ${styles.deleteBtn}`}
                                                            onClick={() => handleDeleteEvent(event.id)}
                                                            title="Delete event"
                                                            aria-label="Delete event"
                                                        >
                                                            <MdDelete size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: INLINE INTERACTIVE PANEL (ADD / EDIT / REPEAT) */}
                        <div className={styles.rightPanelContainer}>
                            {panelMode === 'edit' && selectedEvent ? (
                                /* EDIT EVENT MODE */
                                <form onSubmit={handleSaveEdit} className={styles.addEventForm}>
                                    <div className={styles.panelHeaderRow}>
                                        <h4 className={styles.panelTitle}>
                                            <MdEdit size={16} style={{ color: '#60a5fa' }} />
                                            Edit Event
                                        </h4>
                                        <button
                                            type="button"
                                            className={styles.cancelModeBtn}
                                            onClick={handleCancelPanel}
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Event Title..."
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className={styles.eventInput}
                                        autoFocus
                                        disabled={isSubmitting}
                                    />

                                    <CustomDatePicker
                                        value={editDate}
                                        onChange={setEditDate}
                                    />

                                    <div className={styles.eventTypeButtonGroup}>
                                        {eventTypes.map((type) => {
                                            const isSelected = editType === type.id;
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    className={`${styles.typeSelectorButton} ${isSelected ? styles.activeTypeButton : ""}`}
                                                    onClick={() => {
                                                        setEditType(type.id);
                                                        setEditColorId(type.colorId);
                                                    }}
                                                    disabled={isSubmitting}
                                                >
                                                    <span style={{ color: googleColors[type.colorId] || '#5484ed', display: 'flex', alignItems: 'center' }}>
                                                        {type.icon}
                                                    </span>
                                                    <span>{type.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className={styles.buttonRow}>
                                        <button
                                            type="button"
                                            className={styles.secondaryBtn}
                                            onClick={handleCancelPanel}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className={styles.editSubmitBtn}
                                            disabled={!editTitle.trim() || !editDate || isSubmitting}
                                        >
                                            {isSubmitting ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            ) : panelMode === 'repeat' && selectedEvent ? (
                                /* REPEAT EVENT MODE */
                                <div className={styles.repeatSection}>
                                    <div className={styles.panelHeaderRow}>
                                        <h4 className={styles.panelTitle}>
                                            <MdRepeat size={16} style={{ color: '#c084fc' }} />
                                            Repeat Event
                                        </h4>
                                        <button
                                            type="button"
                                            className={styles.cancelModeBtn}
                                            onClick={handleCancelPanel}
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <div className={styles.modeTargetBadge}>
                                        {getEventTypeIcon(selectedEvent.type)}
                                        <span className={styles.modeTargetName}>{selectedEvent.title}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#a1a1aa' }}>
                                            Starts: {selectedEvent.date}
                                        </span>
                                    </div>

                                    <CustomSelect
                                        options={REPEAT_PRESETS}
                                        value={repeatPreset}
                                        onChange={setRepeatPreset}
                                        accentColor="#a855f7"
                                        disabled={isSubmitting}
                                    />

                                    {repeatPreset === 'custom' && (
                                        <div className={styles.customInputsGrid}>
                                            <div className={styles.customInputGroup}>
                                                <span className={styles.customInputLabel}>Unit</span>
                                                <CustomSelect
                                                    options={FREQUENCY_OPTIONS}
                                                    value={customFrequency}
                                                    onChange={(val) => setCustomFrequency(val as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                                                    accentColor="#a855f7"
                                                    compact
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className={styles.customInputGroup}>
                                                <span className={styles.customInputLabel}>Count (Times)</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={52}
                                                    value={customCount}
                                                    onChange={(e) => setCustomCount(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
                                                    className={styles.numberInput}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* LIVE DATES PREVIEW */}
                                    <div className={styles.previewDatesWrapper}>
                                        <div className={styles.previewHeader}>
                                            <span>Upcoming Generated Dates</span>
                                            <span className={styles.previewBadge}>+{repeatGeneratedDates.length} occurrences</span>
                                        </div>
                                        <div className={styles.previewDatesScroll}>
                                            {repeatGeneratedDates.map((dateStr, idx) => (
                                                <span key={dateStr} className={styles.previewChip}>
                                                    <span className={styles.previewIndex}>#{idx + 1}</span>
                                                    <span>{format(parseISO(dateStr), 'MMM d, yyyy')}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.buttonRow}>
                                        <button
                                            type="button"
                                            className={styles.secondaryBtn}
                                            onClick={handleCancelPanel}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.repeatSubmitBtn}
                                            onClick={handleExecuteRepeat}
                                            disabled={isSubmitting || repeatGeneratedDates.length === 0}
                                        >
                                            {isSubmitting ? "Creating..." : `Create ${repeatGeneratedDates.length} Repeated Events`}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ADD NEW EVENT MODE (DEFAULT) */
                                <form onSubmit={handleAddEvent} className={styles.addEventForm}>
                                    <h4 className={styles.formTitle}>Add New Event</h4>
                                    <input
                                        type="text"
                                        placeholder={user ? "Event Title..." : "Please log in to add events"}
                                        value={newEventTitle}
                                        onChange={(e) => setNewEventTitle(e.target.value)}
                                        className={styles.eventInput}
                                        disabled={!user || isSubmitting}
                                    />

                                    <div className={styles.eventTypeButtonGroup}>
                                        {eventTypes.map((type) => {
                                            const isSelected = eventType === type.id;
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    className={`${styles.typeSelectorButton} ${isSelected ? styles.activeTypeButton : ""}`}
                                                    onClick={() => {
                                                        setEventType(type.id);
                                                        setEventColorId(type.colorId);
                                                    }}
                                                    disabled={!user || isSubmitting}
                                                >
                                                    <span style={{ color: googleColors[type.colorId] || '#5484ed', display: 'flex', alignItems: 'center' }}>
                                                        {type.icon}
                                                    </span>
                                                    <span>{type.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* CUSTOM STYLED TOGGLE SWITCH (NO HTML CHECKBOX) */}
                                    <label className={styles.customSwitchLabel}>
                                        <div className={styles.switchLeftInfo}>
                                            <MdRepeat size={15} style={{ color: isRepeatActive ? '#c084fc' : '#a1a1aa' }} />
                                            <span>Repeat event</span>
                                        </div>
                                        <div className={styles.switchContainer}>
                                            <input
                                                type="checkbox"
                                                className={styles.switchInput}
                                                checked={isRepeatActive}
                                                onChange={(e) => setIsRepeatActive(e.target.checked)}
                                                disabled={!user || isSubmitting}
                                            />
                                            <span className={styles.switchSlider} />
                                        </div>
                                    </label>

                                    {/* CUSTOM DROPDOWN (NO HTML SELECT) */}
                                    {isRepeatActive && (
                                        <CustomSelect
                                            options={REPEAT_PRESETS.filter(p => p.value !== 'custom')}
                                            value={addRepeatPreset}
                                            onChange={setAddRepeatPreset}
                                            accentColor="#a855f7"
                                            disabled={!user || isSubmitting}
                                        />
                                    )}

                                    <button
                                        type="submit"
                                        className={styles.submitEventButton}
                                        disabled={!user || isSubmitting || !newEventTitle.trim()}
                                    >
                                        {user ? (isRepeatActive ? "Add & Repeat Event" : "Add Event") : "Log in to add"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Normal Takvim Görünümü */
                <div className={styles.gridContainer}>
                    <div className={styles.header}>
                        <div className={styles.headerTitleSection}>
                            <h3 className={styles.monthTitle}>
                                {format(currentMonth, 'MMMM yyyy')}
                            </h3>
                            <button onClick={goToToday} className={styles.actionBtn}>
                                Today
                            </button>
                        </div>

                        <div className={styles.navigationButtons}>
                            <button onClick={prevMonth} className={styles.iconNavBtn}>
                                <FaChevronLeft size={14} />
                            </button>
                            <button onClick={nextMonth} className={styles.iconNavBtn}>
                                <FaChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.weekdaysGrid}>
                        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                    </div>

                    <div className={styles.daysGrid}>
                        {days.map((day: Date, idx: number) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const dayFormatted = format(day, 'yyyy-MM-dd');
                            const isSelected = selectedDate === dayFormatted;
                            const isToday = isSameDay(day, new Date());
                            const dayEvents = events.filter(e => e.date === dayFormatted);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDaySelect(day)}
                                    className={`${styles.dayCell} ${!isCurrentMonth ? styles.otherMonthDay : ''} ${isSelected ? styles.selectedDayCell : ''}`}
                                >
                                    <div className={styles.badgeWrapper}>
                                        <span className={`${styles.dayBadge} ${isToday ? styles.todayBadge : ''}`}>
                                            {format(day, 'd')}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.desktopZoomButton}
                                            onClick={(e) => handleZoomClick(e, day)}
                                            title="View Day Details"
                                        >
                                            <FaSearch size={10} />
                                        </button>
                                    </div>

                                    {/* Mobile-only Event Indicator: small colored dots showing events exist */}
                                    <div className={styles.mobileEventIndicator}>
                                        {dayEvents.slice(0, 3).map((event, i) => (
                                            <span
                                                key={event.id || i}
                                                className={styles.mobileEventDot}
                                                style={{ backgroundColor: googleColors[event.colorId] || '#5484ed' }}
                                                title={event.title}
                                            />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className={styles.mobileEventMore}>+{dayEvents.length - 3}</span>
                                        )}
                                    </div>

                                    {/* Desktop Events pills */}
                                    <div className={styles.eventsContainer}>
                                        {dayEvents.slice(0, 2).map((event, i) => (
                                            <div
                                                key={event.id || i}
                                                className={styles.eventItem}
                                                title={event.title}
                                                style={{ borderLeft: `2px solid ${googleColors[event.colorId] || '#5484ed'}` }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleZoomClick(e as any, day);
                                                }}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <span className={styles.moreEvents}>+{dayEvents.length - 2} more</span>
                                        )}
                                    </div>

                                    {/* Mobile-only Clickable Zoom Button */}
                                    <button
                                        type="button"
                                        className={styles.mobileZoomButton}
                                        onClick={(e) => handleZoomClick(e, day)}
                                        aria-label={`View events for ${dayFormatted}`}
                                        title="View Day Details"
                                    >
                                        <FaSearch size={10} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </BaseCard>
    );
}
