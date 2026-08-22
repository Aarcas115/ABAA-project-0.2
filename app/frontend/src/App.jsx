import React, { useState } from 'react'
import TranscriptForm from './components/TranscriptForm'
import OutputDisplay from './components/OutputDisplay'

function App() {
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleResult = (result) => {
    setAnalysisResult(result)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-xl font-semibold">ABAA - AI Business Analyst Assistant</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-4 text-gray-200">Transcript Input</h2>
          <div className="border-2 border-gray-700 rounded-lg p-4 bg-gray-800/50">
            <TranscriptForm onResult={handleResult} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4 text-gray-200">Analysis Output</h2>
          <div className="border-2 border-gray-700 rounded-lg p-4 bg-gray-800/50">
            <OutputDisplay result={analysisResult} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 p-4 text-center text-sm text-gray-400">
        <p>ABAA Phase 1 - Frontend Scaffold</p>
      </footer>
    </div>
  )
}

export default App
