import Login from './pages/Login2'
import SignUp from './pages/SignUp'
import Home from './pages/Home.jsx';
import ProblemPage from './pages/ProblemPage.jsx';
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CreateProblem from './pages/CreateProblem.jsx';
import { Admin } from './pages/Admin.jsx';
import SubmissionTable from './pages/SubmissionTable.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AITools from './pages/AITools.jsx';
import ContestList from './pages/ContestList.jsx';
import ContestDetail from './pages/ContestDetail.jsx';
import CreateContest from './pages/CreateContest.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<Navigate to="/login" replace />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/home' element={<Home />} />
      <Route path='/createproblem' element={<CreateProblem />} />
      <Route path='/admin' element={<Admin />} />
      <Route path='/problem/:id' element={<ProblemPage />} />
      <Route path='/submissions' element={<SubmissionTable />} />
      <Route path='/profile' element={<ProfilePage />} />
      <Route path='/ai-tools' element={<AITools />} />
      <Route path='/contests' element={<ContestList />} />
      <Route path='/contests/create' element={<CreateContest />} />
      <Route path='/contests/:id' element={<ContestDetail />} />
    </Routes>
  </BrowserRouter>
)
