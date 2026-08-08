//COMPONENTS
import CalendarCard from "./_components/CalendarCard/CalendarCard";
import TodoCard from './_components/TodoCard/TodoCard';
import WeatherCard from './_components/WeatherCard/WeatherCard';

import layout from "./page.module.css"

const page = () => {
    return (
        <div className={layout.datePageContainer}>
            <CalendarCard />
            <WeatherCard />
            <TodoCard />
        </div>
    )
}

export default page