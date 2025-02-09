import { Route, Routes } from "react-router-dom"
import { HomePage } from "../pages/Home"
import { RoomPage } from "../pages/Room"
import { Notfoundpage } from "../pages/Notfoundpage"

const App = () => {
    return( 
    <div className="App">

      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="a" element={<RoomPage/>}/>
        <Route path="*" element={<Notfoundpage/>}/>
      </Routes>
  </div>
  )
}
export {App}