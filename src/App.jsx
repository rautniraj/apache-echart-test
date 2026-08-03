import ApacheEchart from './components/ApacheEchart'
import "./App.css";

export default function App() {
  return (
    <ApacheEchart isLoading={false} ministryUsage={response.data.data} period={"Jan 2026 to July 2026"} />
  )
}
