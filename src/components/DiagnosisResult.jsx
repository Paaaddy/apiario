export default function DiagnosisResult({ node, onReset }) {
  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <div className={`rounded-xl p-5 ${node.callExpert ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
        <p className="text-xs uppercase tracking-widest font-medium mb-1 text-brown-mid">Likely cause</p>
        <h2 className="font-serif text-lg font-bold text-brown">{node.diagnosis}</h2>
        {node.callExpert && (
          <div className="mt-2 flex items-center gap-2 text-red-700 text-sm font-medium">
            <span>⚠️</span>
            <span>Contact a beekeeping expert</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-serif text-base font-semibold text-brown mb-3">What to do</h3>
        <ol className="flex flex-col gap-2">
          {node.actions.map((action, i) => (
            <li key={i} className="flex gap-3 bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
              <span className="text-honey font-bold text-sm shrink-0">{i + 1}.</span>
              <span className="text-sm text-brown-mid leading-relaxed">{action}</span>
            </li>
          ))}
        </ol>
      </div>

      <button
        onClick={onReset}
        className="mt-2 w-full bg-honey text-brown font-semibold py-3 rounded-xl active:bg-honey-dark transition-colors"
      >
        Start over
      </button>
    </div>
  )
}
