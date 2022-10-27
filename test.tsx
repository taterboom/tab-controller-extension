import ReactDOM from "react-dom/client"

type TestProps = {}

function Test(props: TestProps) {
  return <div>123</div>
}

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<Test />)
