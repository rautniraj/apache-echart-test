import ApacheEchart from './components/ApacheEchart'
// import response from "./assets/sample_8.json";
import response from "./assets/sample_all.json";

export default function App() {
  return (
    <ApacheEchart isLoading={false} ministryUsage={response.data.data} />
  )
}
