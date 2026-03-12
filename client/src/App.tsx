import { Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { AvailabilityPage } from "./pages/AvailabilityPage";
import { BookingPage } from "./pages/BookingPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { EventTypesPage } from "./pages/EventTypesPage";
import { MeetingsPage } from "./pages/MeetingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/book/:slug" element={<BookingPage />} />
      <Route path="/book/:slug/confirmed/:meetingId" element={<ConfirmationPage />} />
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<EventTypesPage />} />
        <Route path="availability" element={<AvailabilityPage />} />
        <Route path="meetings" element={<MeetingsPage />} />
      </Route>
    </Routes>
  );
}
