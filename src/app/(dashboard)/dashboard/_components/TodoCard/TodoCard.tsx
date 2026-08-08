import styles from "./TodoCard.module.css";
import BaseCard from "@/components/ui/BaseCard/BaseCard";

const TodoCard = () => {
    return (
        <BaseCard className={styles.todoCardContainer}>TodoCard</BaseCard>
    )
}

export default TodoCard