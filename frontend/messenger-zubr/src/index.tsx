import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './components/App';
import { BrowserRouter } from 'react-router-dom';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <React.StrictMode>
  <BrowserRouter>
  <div>
    <h1>Проверка</h1>
    </div>
    <App/>
  </BrowserRouter>
  // </React.StrictMode>
);


