import { useEffect } from "react"
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { RoomComponent } from "../components/Room/RoomComponent";

const RoomPage = () => {

    return (
    <div>
        Room page
        <RoomComponent/>
    </div>
    )
}
export {RoomPage}