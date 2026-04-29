import React from 'react'
import OjLayout from './OjLayout';
import Header from './Header';
import { useParams } from 'react-router-dom';

const ProblemPage = () => {
  const { id } = useParams();

  return (
    <>
      <Header />
      <OjLayout problemId={id} />
    </>
  )
}

export default ProblemPage