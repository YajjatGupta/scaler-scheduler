import { CalendarDays, ChevronLeft, Clock3, Link as LinkIcon, LayoutGrid, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { EventType } from "../types";

const items = [
  { to: "/", label: "Event Types", icon: LayoutGrid },
  { to: "/availability", label: "Availability", icon: Clock3 },
  { to: "/meetings", label: "Meetings", icon: CalendarDays }
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const [publicLink, setPublicLink] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [publicLinkStatus, setPublicLinkStatus] = useState("Ready for invitees");

  useEffect(() => {
    async function loadPublicLink() {
      try {
        const eventTypes = await api<EventType[]>("/event-types");
        const link = eventTypes[0] ? `${window.location.origin}/book/${eventTypes[0].slug}` : "";
        setPublicLink(link);
        setPublicLinkStatus(link ? "Ready for invitees" : "No public link yet");
      } catch {
        setPublicLink("");
        setPublicLinkStatus("No public link yet");
      }
    }

    void loadPublicLink();
  }, []);

  async function copyPublicLink() {
    if (!publicLink) {
      return;
    }

    await navigator.clipboard.writeText(publicLink);
    setPublicLinkStatus("Link copied");
    window.setTimeout(() => {
      setPublicLinkStatus("Ready for invitees");
    }, 2000);
  }

  function handleCreateClick() {
    navigate("/?create=1");
  }

  return (
    <div className={`shell${isCollapsed ? " collapsed" : ""}`}>
      <aside className={`sidebar${isCollapsed ? " collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark">C</div>
            <div>
              <p>Calendly</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle-button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => setIsCollapsed((current) => !current)}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <button type="button" className="button sidebar-create-button" onClick={handleCreateClick}>
          <Plus size={18} />
          <span>Create</span>
        </button>

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

        <button
          type="button"
          className={`sidebar-card${publicLink ? " clickable" : " disabled"}`}
          onClick={() => void copyPublicLink()}
          disabled={!publicLink}
        >
          <p>Public links</p>
          <span>
            {publicLink ? "Each event type generates a shareable page." : "Create an event type to enable links."}
          </span>
          <div className="inline-icon">
            <LinkIcon size={16} />
            <span>{publicLinkStatus}</span>
          </div>
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
