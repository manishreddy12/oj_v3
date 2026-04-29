const Footer = () => (
  <footer className="bg-slate-800 text-slate-400 mt-auto">
    <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
      <span className="text-sm text-center md:text-left">
        © 2025 <span className="text-white font-semibold">CodeView™</span>. All Rights Reserved.
      </span>
      <ul className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1 text-sm">
        {['About', 'Privacy Policy', 'Licensing', 'Contact'].map((item) => (
          <li key={item}>
            <a href="#" className="hover:text-white transition-colors">{item}</a>
          </li>
        ))}
      </ul>
    </div>
  </footer>
);

export default Footer;
