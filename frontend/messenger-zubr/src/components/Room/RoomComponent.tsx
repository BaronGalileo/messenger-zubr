import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useEffect } from "react";
import axios from "axios";
import { api } from "../../services/api";

export const RoomComponent = () => {

    const isAuth = useSelector((state: RootState) => state.auth);

    const path = "/messenger/conversations/"
    

    useEffect(() => {
        if(isAuth.isAuth) {
            console.log("isAuth")
            api.get(path).then(res => {console.log(res.data)})
        
        }

    }, [])

    return(
    <>
        {isAuth.isAuth&&
            <div>Комната и компонента</div>}
        <div>Комната без компонента</div>
    </>

    )
}