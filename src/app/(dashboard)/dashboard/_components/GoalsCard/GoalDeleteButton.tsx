import { MdDelete } from "react-icons/md";
import styles from "./GoalsCard.module.css"

interface GoalDeleteButtonProps {
    id: string;
    onClick: (id: string) => void;
}


const GoalDeleteButton = ({ id, onClick }: GoalDeleteButtonProps) => {
    const handleClick = (e: React.MouseEvent<SVGElement>) => {
        e.stopPropagation();
        onClick(id);
    };

    return (
        <MdDelete onClick={handleClick} className={styles.deleteButton}>

        </MdDelete>
    )
}

export default GoalDeleteButton