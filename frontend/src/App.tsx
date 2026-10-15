import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DialogProvider from './components/DialogProvider';
import Schools from './pages/Schools';
import SchoolLayout from './pages/SchoolLayout';
import SchoolHome from './pages/SchoolHome';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Classes from './pages/Classes';
import Generate from './pages/Generate';
import Schedules from './pages/Schedules';

export default function App() {
  return (
    <DialogProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Schools />} />
          <Route path="/school/:schoolId" element={<SchoolLayout />}>
            <Route index element={<SchoolHome />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="classes" element={<Classes />} />
            <Route path="generate" element={<Generate />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="*" element={<SchoolHome />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DialogProvider>
  );
}
