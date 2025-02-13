import { CardRoom } from "../components/Card_Room/CardRoom"
import { LoginForm } from "../components/LoginForm/LoginForm"
import { TestChat } from "../components/testComponents/testChat"

const HomePage = () => {
    return (
        <div>
            <LoginForm/>
            <CardRoom/>
            <CardRoom/>
            <CardRoom/>
            <TestChat/>
        </div>
    )
}
export {HomePage}