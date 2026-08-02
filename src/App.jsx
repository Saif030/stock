import { StockProvider } from './context/StockContext';
import Dashboard from './components/Dashboard';

export default function App() {

  return (
    <StockProvider>
      <Dashboard />
    </StockProvider>
  );
}