import { CardRoom } from "../components/Card_Room/CardRoom"
import { LoginForm } from "../components/LoginForm/LoginForm"

const HomePage = () => {
    return (
        <div>
            <LoginForm/>
            <CardRoom/>
            <CardRoom/>
            <CardRoom/>
        </div>
    )
}
export {HomePage}