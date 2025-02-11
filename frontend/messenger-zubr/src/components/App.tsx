import { Route, Routes } from "react-router-dom"
import { useForm, FormProvider } from "react-hook-form";
import { HomePage } from "../pages/Home"
import { RoomPage } from "../pages/Room"
import { Notfoundpage } from "../pages/Notfoundpage"

const App = () => {
  
  const methods = useForm({
    mode: "onBlur"
  })

  return(
    <div className="App">
      <FormProvider {...methods}>
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="a" element={<RoomPage/>}/>
          <Route path="*" element={<Notfoundpage/>}/>
        </Routes>
      </FormProvider>
    </div>
  )
}
export {App}