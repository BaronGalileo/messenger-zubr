import { useEffect } from "react"
import { CardRoom } from "../components/Card_Room/CardRoom"
import { LoginForm } from "../components/LoginForm/LoginForm"
import { TestChat } from "../components/testComponents/testChat"
import {ChatComponent} from "../components/testComponents/Ws"
import { useDispatch } from "react-redux"
import { removeAuth } from "../store/authSlice"

const HomePage = () => {

    const dispatch = useDispatch();


    useEffect(() => {
        dispatch(removeAuth())
    }, [])
    
    return (
        <div>
            <LoginForm/>
            <CardRoom/>
            <CardRoom/>
            <CardRoom/>
            {/* <TestChat/> */}
            <ChatComponent roomId={3}/>
        </div>
    )
}
export {HomePage}