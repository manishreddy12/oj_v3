import React from 'react'
import Header from './Header';
import ProblemsTable from './ProblemsTable';
import Footer from './Footer';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <ProblemsTable />
      </main>
      <Footer />
    </div>
  )
}

export default Home
