import ProjectsCard from "./components/ProjectsCard/ProjectsCard";
import styles from "./page.module.css";

const ProjectsPage = () => {
    return (
        <div className={styles.pageContainer}>
            <ProjectsCard />
        </div>
    );
};

export default ProjectsPage;
