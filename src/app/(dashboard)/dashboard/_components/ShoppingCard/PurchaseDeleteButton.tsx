import { MdDelete } from "react-icons/md";
import styles from "./ShoppingCard.module.css";

interface PurchaseDeleteButtonProps {
    id: string;
    onClick: (id: string) => void;
}


const PurchaseDeleteButton = ({ id, onClick }: PurchaseDeleteButtonProps) => {
    const handleClick = (e: React.MouseEvent<SVGElement>) => {
        e.stopPropagation();
        onClick(id);
    };

    return (
        <MdDelete onClick={handleClick} className={styles.deleteButton}>

        </MdDelete>
    )
}

export default PurchaseDeleteButton