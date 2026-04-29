import React from 'react';
import Login from './pages/Login2'
import SignUp from './pages/SignUp'
import ReactDOM from "react-dom/client";
import {BrowserRouter, Routes, Route,Navigate} from "react-router-dom"
import Header from './pages/Header';  

function App() {
  return (
    // <>
    //   <Login></Login>
    //   <SignUp></SignUp>
    // </>
    <>
      <Header></Header>
    </>
  );
}

export default App;