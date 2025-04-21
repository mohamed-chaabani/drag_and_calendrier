import React from 'react';
import {
  Scheduler,
  Toolbar,
  Appointments,
  WeekView,
  MonthView,
  DayView,
  AppointmentForm,
  AppointmentTooltip,
  DragDropProvider,
} from "@devexpress/dx-react-scheduler-material-ui";
import {
  ViewState,
  EditingState,
  IntegratedEditing,
} from "@devexpress/dx-react-scheduler";
import CustomWeekTimeTableCell from "./CustomWeekTimeTableCell";
import CustomDayTimeTableCell from "./CustomDayTimeTableCell";
import CustomMonthCell from "./CustomMonthCell";
import AppointmentContent from "../AppointmentContent";

interface CalendarProps {
  startDate: Date;
  endDate: Date;
  appointments: any[];
  onAppointmentAdd: (appointment: any) => void;
  onAppointmentUpdate: (appointment: any) => void;
  onAppointmentDelete: (appointment: any) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  startDate,
  endDate,
  appointments,
  onAppointmentAdd,
  onAppointmentUpdate,
  onAppointmentDelete,
}) => {
  return (
    <Scheduler
      data={appointments}
      startDate={startDate}
      endDate={endDate}
    >
      <ViewState
        defaultCurrentDate={new Date()}
        defaultCurrentViewName="Week"
      />
      <EditingState
        onCommitChanges={(changes) => {
          const { added, changed, deleted } = changes;
          if (added) {
            onAppointmentAdd(added);
          }
          if (changed) {
            onAppointmentUpdate(changed);
          }
          if (deleted !== undefined) {
            onAppointmentDelete(deleted);
          }
        }}
      />
      <IntegratedEditing />
      <Toolbar
        views={[
          { name: "Week", title: "Semaine" },
          { name: "Month", title: "Mois" },
          { name: "Day", title: "Jour" },
        ]}
      />
      <WeekView
        timeCellComponent={CustomWeekTimeTableCell}
        startDayHour={8}
        endDayHour={18}
      />
      <MonthView
        cellComponent={CustomMonthCell}
        startDayHour={8}
        endDayHour={18}
      />
      <DayView
        timeCellComponent={CustomDayTimeTableCell}
        startDayHour={8}
        endDayHour={18}
      />
      <Appointments />
      <AppointmentForm />
      <AppointmentTooltip
        contentComponent={AppointmentContent}
      />
      <DragDropProvider />
    </Scheduler>
  );
};

export default Calendar;
