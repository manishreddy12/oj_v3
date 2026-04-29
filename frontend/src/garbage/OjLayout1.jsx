import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const OjLayout = ({pcode}) => {
  const [problem,setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'verdict'
  const [leftWidth, setLeftWidth] = useState('50%');
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadProblem =async () =>{
      try{
        const response = await axios.get(`http://localhost:4000/readProblem/${pcode}`);
        console.log("Fetched data is " + response.data);
        setProblem(response.data);
      }
      catch(err){
        console.log("Error occurred ", err);
      }
    };
    loadProblem();
  },[])

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');

  const handleMouseDown = (e) => {
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Limit min and max width
    if (newLeftWidth > 20 && newLeftWidth < 80) {
      setLeftWidth(`${newLeftWidth}%`);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleRunCode = () => {
    // Simulate code execution
    setOutput("Running test cases...\n\nTest case 1: Passed\nInput: [2,7,11,15], 9\nOutput: [0,1]\nExpected: [0,1]");
  };

  return (
    <div 
      ref={containerRef}
      className="flex h-screen w-full overflow-hidden relative"
    >
      {/* Problem Panel (Left) */}
      <div 
        className="h-full overflow-auto p-4 bg-white"
        style={{ width: leftWidth }}
      >
        <h1 className="text-2xl font-bold mb-2">{problem.pname}</h1>
        <span className={`inline-block px-2 py-1 text-xs rounded-md mb-4 ${
          problem.pdifficulty === 'Easy' ? 'bg-green-100 text-green-800' :
          problem.pdifficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {problem.difficulty}
        </span>

        <div className="prose max-w-none">
          <p className="mb-4">{problem.description}</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Example:</h3>
          <div className="bg-gray-50 p-4 rounded-md my-2">
            <p className="font-medium">Example 1:</p>
            <p>Input: <code>{problem.examples[0].input}</code></p>
            <p>Output: <code>{problem.examples[0].output}</code></p>
            <p>Explanation: {problem.examples[0].explanation}</p>
          </div>
        </div>
      </div>

      {/* Resizable Splitter */}
      <div 
        className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize"
        onMouseDown={handleMouseDown}
      />

      {/* Code/Verdict Panel (Right) */}
      <div 
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{ width: `calc(100% - ${leftWidth} - 4px)` }}
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'code' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'verdict' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('verdict')}
          >
            Verdict
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'code' ? (
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-gray-200 bg-gray-50">
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
                <button 
                  onClick={handleRunCode}
                  className="ml-2 px-4 py-1 bg-blue-500 text-white text-sm rounded"
                >
                  Run
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 w-full p-4 font-mono text-sm outline-none resize-none"
                placeholder="Enter your code here..."
              />
            </div>
          ) : (
            <div className="h-full p-4 overflow-auto bg-gray-50 font-mono text-sm whitespace-pre">
              {output || "Run your code to see the verdict"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OjLayout;