import { CalendarDays, Clock3, Link as LinkIcon, LayoutGrid } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const items = [
  { to: "/", label: "Event Types", icon: LayoutGrid },
  { to: "/availability", label: "Availability", icon: Clock3 },
  { to: "/meetings", label: "Meetings", icon: CalendarDays }
];

export function DashboardLayout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <p>Scaler Scheduler</p>
            <span>Calendly-inspired booking flow</span>
          </div>
        </div>
        <nav className="nav">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-card">
          <p>Public links</p>
          <span>Each event type generates a shareable page.</span>
          <div className="inline-icon">
            <LinkIcon size={16} />
            <span>Ready for invitees</span>
          </div>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
