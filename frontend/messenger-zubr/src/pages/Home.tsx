import { CardRoom } from "../components/Card_Room/CardRoom"
import { LoginForm } from "../components/LoginForm/LoginForm"
import { TestChat } from "../components/testComponents/testChat"
import {ChatComponent} from "../components/testComponents/Ws"

const HomePage = () => {
    return (
        <div>
            <LoginForm/>
            <CardRoom/>
            <CardRoom/>
            <CardRoom/>
            <TestChat/>
            <ChatComponent roomId={3}/>
        </div>
    )
}
export {HomePage}