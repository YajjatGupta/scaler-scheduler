import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek
} from "date-fns";

type DayData = {
  date: string;
  isAvailable: boolean;
};

type Props = {
  month: string;
  days: DayData[];
  selectedDate?: string;
  onSelect: (date: string) => void;
};

export function CalendarMonth({ month, days, selectedDate, onSelect }: Props) {
  const monthDate = parseISO(`${month}-01`);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })
  });
  const dayMap = new Map(days.map((day) => [day.date, day]));

  return (
    <div className="calendar">
      <div className="calendar-grid labels">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const info = dayMap.get(key);
          const isSelected = selectedDate === key;
          const isMuted = format(day, "MM") !== month.slice(5, 7);

          return (
            <button
              key={key}
              type="button"
              className={`calendar-day${info?.isAvailable ? " available" : ""}${isSelected ? " selected" : ""}${isMuted ? " muted" : ""}`}
              onClick={() => info?.isAvailable && onSelect(key)}
              disabled={!info?.isAvailable}
            >
              <span>{format(day, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
