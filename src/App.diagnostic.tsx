import { DiagnosticTest } from './components/DiagnosticTest';
import { ThemeProvider } from './components/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <DiagnosticTest />
    </ThemeProvider>
  );
}
