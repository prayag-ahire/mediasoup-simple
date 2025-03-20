
import Reciever from '../components/reciever'
import Sender from '../components/sender'
import './App.css'
import {BrowserRouter,Route,Routes} from "react-router-dom"

function App() {
  

  return (
    <BrowserRouter>
    <Routes>
      <Route path='/sender' element={<Sender/>}/>
      <Route path='/receiver' element={<Reciever/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App
