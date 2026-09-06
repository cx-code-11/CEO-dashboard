import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Briefcase, CheckSquare, FileStack } from 'lucide-react';
import api from '../../api/axios';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };
  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };
  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };
  const label = () => {
    const date = format(toolbar.date, 'MMMM yyyy');
    return <span className="font-bold text-lg text-slate-800 dark:text-white">{date}</span>;
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex gap-2">
        <button onClick={goToCurrent} className="btn-secondary py-1.5 px-3">Today</button>
        <button onClick={goToBack} className="btn-secondary py-1.5 px-3">Back</button>
        <button onClick={goToNext} className="btn-secondary py-1.5 px-3">Next</button>
      </div>
      <div>{label()}</div>
      <div className="flex gap-2">
        <button onClick={() => toolbar.onView('month')} className={`btn-secondary py-1.5 px-3 ${toolbar.view === 'month' ? 'bg-slate-200 dark:bg-slate-700' : ''}`}>Month</button>
        <button onClick={() => toolbar.onView('week')} className={`btn-secondary py-1.5 px-3 ${toolbar.view === 'week' ? 'bg-slate-200 dark:bg-slate-700' : ''}`}>Week</button>
        <button onClick={() => toolbar.onView('day')} className={`btn-secondary py-1.5 px-3 ${toolbar.view === 'day' ? 'bg-slate-200 dark:bg-slate-700' : ''}`}>Day</button>
        <button onClick={() => toolbar.onView('agenda')} className={`btn-secondary py-1.5 px-3 ${toolbar.view === 'agenda' ? 'bg-slate-200 dark:bg-slate-700' : ''}`}>Agenda</button>
      </div>
    </div>
  );
};

const ERPCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, leavesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/leaves')
      ]);

      const newEvents = [];

      // Map Tasks
      if (tasksRes.data.success) {
        tasksRes.data.data.forEach(task => {
          if (task.dueDate) {
            newEvents.push({
              id: task._id,
              title: `Task: ${task.title}`,
              start: new Date(task.dueDate),
              end: new Date(task.dueDate),
              allDay: true,
              type: 'Task',
              resource: task
            });
          }
        });
      }

      // Map Projects
      if (projectsRes.data.success) {
        projectsRes.data.data.forEach(project => {
          if (project.startDate && project.endDate) {
            newEvents.push({
              id: project._id,
              title: `Project: ${project.name}`,
              start: new Date(project.startDate),
              end: new Date(project.endDate),
              allDay: true,
              type: 'Project',
              resource: project
            });
          }
        });
      }

      // Map Leaves
      if (leavesRes.data.success) {
        leavesRes.data.data.forEach(leave => {
          if (leave.status === 'Approved' && leave.startDate && leave.endDate) {
            newEvents.push({
              id: leave._id,
              title: `Leave: ${leave.employee?.name} (${leave.leaveType})`,
              start: new Date(leave.startDate),
              end: new Date(leave.endDate),
              allDay: true,
              type: 'Leave',
              resource: leave
            });
          }
        });
      }

      setEvents(newEvents);
    } catch (error) {
      console.error('Failed to fetch calendar events', error);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    if (event.type === 'Task') backgroundColor = '#eab308'; // Yellow
    if (event.type === 'Project') backgroundColor = '#3b82f6'; // Blue
    if (event.type === 'Leave') backgroundColor = '#10b981'; // Green

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const filteredEvents = filter === 'All' ? events : events.filter(e => e.type === filter);

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <CalendarIcon className="mr-2 text-primary-500" /> Organization Calendar
          </h1>
          <p className="text-slate-500 dark:text-slate-400">View tasks, project timelines, and team leaves in one place.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('All')} className={`btn ${filter === 'All' ? 'btn-primary' : 'btn-secondary'}`}>All</button>
          <button onClick={() => setFilter('Task')} className={`btn ${filter === 'Task' ? 'bg-yellow-500 text-white' : 'btn-secondary'}`}>Tasks</button>
          <button onClick={() => setFilter('Project')} className={`btn ${filter === 'Project' ? 'bg-blue-500 text-white' : 'btn-secondary'}`}>Projects</button>
          <button onClick={() => setFilter('Leave')} className={`btn ${filter === 'Leave' ? 'bg-green-500 text-white' : 'btn-secondary'}`}>Leaves</button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 min-h-[600px]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">Loading calendar...</div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar
            }}
            popup
            selectable
            onSelectEvent={(event) => alert(`${event.title}\nStarts: ${format(event.start, 'PP')}\nEnds: ${format(event.end, 'PP')}`)}
          />
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-calendar { font-family: inherit; }
        .rbc-header { padding: 10px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
        .dark .rbc-header { color: #cbd5e1; border-bottom: 1px solid #1e293b; border-left: 1px solid #1e293b; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; }
        .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border: 1px solid #1e293b; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #e2e8f0; }
        .dark .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #1e293b; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #e2e8f0; }
        .dark .rbc-month-row + .rbc-month-row { border-top: 1px solid #1e293b; }
        .rbc-off-range-bg { background: #f8fafc; }
        .dark .rbc-off-range-bg { background: rgba(30, 41, 59, 0.5); }
        .rbc-today { background: #f0fdf4; }
        .dark .rbc-today { background: rgba(16, 185, 129, 0.05); }
        .rbc-event { padding: 2px 5px; font-size: 12px; font-weight: 500; }
        .rbc-show-more { color: #3b82f6; font-weight: 600; background: transparent; }
        .dark .rbc-day-bg, .dark .rbc-month-row { border-color: #1e293b; }
      `}} />
    </div>
  );
};

export default ERPCalendar;
