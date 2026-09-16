"use client"
import { MdAdd } from "react-icons/md"
import styles from "./FinanceTableCard.module.css"

interface AddTableRowButtonProps {
    onClick: () => void;
    isAddingRow: boolean;
}

const AddTableRowButton = ({ onClick, isAddingRow }: AddTableRowButtonProps) => {
    const handleAddTableRowClick = () => {
        if (!isAddingRow) {
            onClick();
        }
    }

    return (
        <button className={styles.addTableRowButton} title="Add table row" onClick={handleAddTableRowClick}>
            <MdAdd className={styles.addTableRowIcon} />
            <span>{isAddingRow ? "Adding..." : "Add table row"}</span>
        </button>
    )
}

export default AddTableRowButton