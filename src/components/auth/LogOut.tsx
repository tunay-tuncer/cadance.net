"use client"

import { logout } from "../../../../lib/fireabase/auth"

const LogOut = () => {

    const handleLogOut = async () => {
        logout();
    }

    return (
        <button onClick={() => handleLogOut()}>LogOut</button>
    )
}

export default LogOut