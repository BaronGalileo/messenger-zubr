export const CardRoom = () => {
    return(
        <div className="card-room-wrapper">
            <div className="card-room-avatar">
                картинка
            </div>
            <div className="card-room-name_contex">
                <div className="card-name">
                    Наименование
                </div>
                <div className="card-contex">
                    содержание
                </div>
            </div>
            <div className="card-room-time_noread">
                <div className="card-time">
                    время создания
                </div>
                <div className="card-noread">
                    непрочтенные сообщения, кол-во
                </div>
            </div>
        </div>
    )
}