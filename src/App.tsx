import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LiquidGlassEditor from "./components/LiquidGlassEditor";
import SkinTest from "./pages/SkinTest";
import Result from "./pages/Result";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LiquidGlassEditor />} />
        <Route path="/skintest" element={<SkinTest />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}