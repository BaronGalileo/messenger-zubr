import { Link } from "react-router-dom";

export const Notfoundpage = () => {
    return(
        <div className="item">
            Такой страницы не сущуствует. Перейдите <Link to="/" style={{color: "#D20A11"}}>Home</Link>
        </div>
    )
}
