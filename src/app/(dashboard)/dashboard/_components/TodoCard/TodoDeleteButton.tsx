import { MdDelete } from "react-icons/md";
import styles from "./TodoCard.module.css"

interface TodoDeleteButtonProps {
    id: string;
    onClick: (id: string) => void;
}


const TodoDeleteButton = ({ id, onClick }: TodoDeleteButtonProps) => {
    const handleClick = (e: React.MouseEvent<SVGElement>) => {
        e.stopPropagation();
        onClick(id);
    };

    return (
        <MdDelete onClick={handleClick} className={styles.deleteButton}>

        </MdDelete>
    )
}

export default TodoDeleteButton