import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CardList from './pages/CardList';
import CardDetail from './pages/CardDetail';
import CreateCard from './pages/CreateCard';
import ComponentShowcase from './pages/ComponentShowcase';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000, // 5 seconds
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold text-gray-900">ClarityFlow</h1>
              <p className="text-sm text-gray-600 mt-1">
                任务澄清系统 - Task Clarification System
              </p>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<CardList />} />
              <Route path="/create" element={<CreateCard />} />
              <Route path="/cards/:id" element={<CardDetail />} />
              <Route path="/ui-showcase" element={<ComponentShowcase />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
