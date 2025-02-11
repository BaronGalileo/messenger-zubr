import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { useEffect } from "react";
import axios from "axios";
import { api } from "../../services/api";
import { removeAuth } from "../../store/authSlice";

export const RoomComponent = () => {

    const isAuth = useSelector((state: RootState) => state.auth);

    const path = "/messenger/conversations/"

    const dispatch: AppDispatch = useDispatch();
    

    useEffect(() => {
        if(isAuth.isAuth) {
            console.log("isAuth")
            api.get(path).then(res => {console.log(res.data)})     
        }

    }, [])

    const del = () => {
            dispatch(removeAuth()) 
        }

    return(
    <>
        {isAuth.isAuth&&
            <div>Комната и компонента</div>}
        <div>Комната без компонента</div>
        <button onClick={del} >Удалить</button>
    </>

    )
}