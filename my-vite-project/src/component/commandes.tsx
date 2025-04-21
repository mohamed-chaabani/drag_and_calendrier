import { useState, useEffect, useRef } from "react";
import OrderDropModal from "../OrderDropModal";
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

const CustomWeekTimeTableCell = (props: any) => {
  const dateStr = props.startDate
    ? props.startDate.toISOString().slice(0, 10)
    : undefined;
  const timeStr = props.startDate
    ? props.startDate.toTimeString().slice(0, 5)
    : undefined;
  return <WeekView.TimeTableCell {...props} data-date={dateStr} data-time={timeStr} />;
};

const CustomDayTimeTableCell = (props: any) => {
  const dateStr = props.startDate
    ? props.startDate.toISOString().slice(0, 10)
    : undefined;
  const timeStr = props.startDate
    ? props.startDate.toTimeString().slice(0, 5)
    : undefined;
  return <DayView.TimeTableCell {...props} data-date={dateStr} data-time={timeStr} />;
};

const CustomMonthCell = (props: any) => {
  const dateStr = props.startDate
    ? props.startDate.toISOString().slice(0, 10)
    : undefined;
  const timeStr = props.startDate
    ? props.startDate.toTimeString().slice(0, 5)
    : undefined;
  return <MonthView.Cell {...props} data-date={dateStr} data-time={timeStr} />;
};

import AppointmentContent from "../AppointmentContent";
import {
  ViewState,
  EditingState,
  IntegratedEditing,
} from "@devexpress/dx-react-scheduler";
import {
  Paper,
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

interface Order {
  No: string;
  Document_Type: string;
  Sell_to_Customer_No?: string;
  Buy_from_Vendor_No?: string;
}

const fetchOrders = async (): Promise<Order[]> => {
  // بيانات ثابتة مؤقتاً
  return [
    // Ventes
    { No: "101002", Document_Type: "Vente", Sell_to_Customer_No: "C001" },
    { No: "101003", Document_Type: "Vente", Sell_to_Customer_No: "C002" },
    { No: "101004", Document_Type: "Vente", Sell_to_Customer_No: "C003" },
    { No: "101005", Document_Type: "Vente", Sell_to_Customer_No: "C004" },
    { No: "101006", Document_Type: "Vente", Sell_to_Customer_No: "C005" },
    // Achats
    { No: "106001", Document_Type: "Achat", Buy_from_Vendor_No: "V001" },
    { No: "106002", Document_Type: "Achat", Buy_from_Vendor_No: "V002" },
    { No: "106003", Document_Type: "Achat", Buy_from_Vendor_No: "V003" },
    { No: "106004", Document_Type: "Achat", Buy_from_Vendor_No: "V004" },
    { No: "106005", Document_Type: "Achat", Buy_from_Vendor_No: "V005" },
  ];
};

export default function SchedulerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<string>("week");
  const [openCalendarDialog, setOpenCalendarDialog] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const schedulerRef = useRef(null);

  useEffect(() => {
    console.log({ appointments });
  }, [appointments]);

  // State for drag & drop modal
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchOrders().then((data) => setOrders(data));
  }, []);

  const commitChanges = ({ added, changed, deleted }: any) => {
    let newAppointments = appointments;
    if (added) {
      const startingId =
        newAppointments.length > 0
          ? newAppointments[newAppointments.length - 1].id + 1
          : 0;
      newAppointments = [...newAppointments, { id: startingId, ...added }];
    }
    if (changed) {
      newAppointments = newAppointments.map((app) =>
        changed[app.id] ? { ...app, ...changed[app.id] } : app
      );
    }
    if (deleted !== undefined) {
      newAppointments = newAppointments.filter((app) => app.id !== deleted);
    }
    setAppointments(newAppointments);
  };

  const handleDragOver = (event: React.DragEvent) => event.preventDefault();
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const orderData = JSON.parse(event.dataTransfer.getData("text"));

    // Try to get the date and time from the scheduler cell
    let cellDate: Date | null = null;
    let el: HTMLElement | null = event.target as HTMLElement;

    console.log({ initialElement: event.target });

    // Start from the target element and go up the DOM tree
    while (el) {
      // debugger;
      console.log("el", el);

      // Check if we're in a td element with data-date
      const dateStr = el.getAttribute("data-date");
      if (dateStr) {
        console.log({
          tagName: el.tagName,
          dataDate: dateStr,
        });
        const [year, month, day] = dateStr.split("-").map(Number);
        console.log({ year, month, day });
        cellDate = new Date(year, month - 1, day);
        console.log("Found dateStr:", dateStr);

        // Get the time from the cell
        const timeStr = el.getAttribute("data-time");
        if (timeStr) {
          const [hours, minutes] = timeStr.split(":").map(Number);
          console.log({ hours, minutes });
          // Create a new date with the date from data-date and time from data-time
          cellDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
          console.log("Final date with time:", cellDate);
          break; // Exit loop when we find the correct cell
        } else {
          // If no time is found, use default time (8:00)
          cellDate = new Date(year, month - 1, day, 8, 0, 0, 0);
          console.log("Using default time (8:00)", cellDate);
          break;
        }
      }
      el = el.parentElement;
    }

    // If we couldn't get the time, use the default 8:00-9:00
    if (!cellDate) {
      cellDate = new Date(currentDate);
      cellDate.setHours(8, 0, 0, 0);
    }

    // Create appointment with the exact time from the cell
    const startDate = new Date(cellDate);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);

    // Ensure the dates are in the correct time zone
    const maxId =
      appointments.length > 0
        ? Math.max(...appointments.map((a) => a.id ?? 0))
        : 0;

    const newAppointment = {
      id: maxId + 1,
      title: orderData.No,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    setAppointments((prev) => [...prev, newAppointment]);
  };

  // Confirm from modal
  const handleConfirmDrop = (selectedDate: Date, order: any) => {
    console.log("handleConfirmDrop is working");
    console.log({ selectedDate, order });
    const startDate = new Date(selectedDate);
    const endDate = new Date(startDate);
    console.log({ startDate, endDate });
    endDate.setHours(startDate.getHours() + 1);
    // Find max id in appointments
    const maxId =
      appointments.length > 0
        ? Math.max(...appointments.map((a) => a.id ?? 0))
        : 0;
    console.log({ maxId });
    const newAppointment = {
      id: maxId + 1,
      title: order.No,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    console.log({ newAppointment });
    setAppointments((prev) => [...prev, newAppointment]);
    setDropModalOpen(false);
    setPendingOrder(null);
  };

  return (
    <Box className="flex flex-col h-screen">
      {/* Header */}
      <Box className="flex items-center justify-end mb-4">
        <Button
          variant="outlined"
          onClick={() => setOpenCalendarDialog(true)}
          startIcon={<CalendarTodayIcon />}
        >
          Sélectionner une date
        </Button>
      </Box>

      <Box
        className="flex flex-1 flex-row overflow-hidden bg-transparent"
        style={{
          display: "flex",
          alignItems: "stretch",
          minHeight: 0,
          height: "100%",
        }}
      >
        {/* Sidebar commandes */}
        <Box
          style={{
            width: 250,
            minWidth: 200,
            background: "#f5f6fa",
            borderRadius: 10,
            boxShadow: "2px 0 8px #0001",
            padding: 16,
            margin: "0 8px 0 0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            height: "100%",
            color: "black",
          }}
        >
          {/* Sidebar commandes */}
          {/* Ventes */}
          <Box className="flex flex-col h-1/2 overflow-y-auto pr-2">
            <Typography variant="h6" className="text-blue-900 mb-2">
              Ventes
            </Typography>
            <List dense>
              {orders
                .filter((o) => o.Sell_to_Customer_No)
                .map((order) => (
                  <ListItem
                    key={order.No}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text", JSON.stringify(order))
                    }
                  >
                    <ListItemText primary={order.No} />
                  </ListItem>
                ))}
            </List>
          </Box>
          {/* Achats */}
          <Box className="flex flex-col h-1/2 overflow-y-auto pr-2">
            <Typography variant="h6" className="text-blue-900 mb-2">
              Achats
            </Typography>
            <List dense>
              {orders
                .filter((o) => o.Buy_from_Vendor_No)
                .map((order) => (
                  <ListItem
                    key={order.No}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text", JSON.stringify(order))
                    }
                  >
                    <ListItemText primary={order.No} />
                  </ListItem>
                ))}
            </List>
          </Box>
          6
        </Box>

        {/* Zone Agenda */}
        <Paper
          className="flex-1 flex flex-col overflow-hidden"
          style={{ margin: 0, height: "100%" }}
        >
          <Box className="flex justify-center gap-2 p-2">
            <Button
              onClick={() => setView("day")}
              variant={view === "day" ? "contained" : "outlined"}
            >
              Jour
            </Button>
            <Button
              onClick={() => setView("week")}
              variant={view === "week" ? "contained" : "outlined"}
            >
              Semaine
            </Button>
            <Button
              onClick={() => setView("month")}
              variant={view === "month" ? "contained" : "outlined"}
            >
              Mois
            </Button>
          </Box>
          <Box
            className="flex-1 overflow-y-auto"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            ref={schedulerRef}
          >
            {/* Modal for order drop */}
            <OrderDropModal
              open={dropModalOpen}
              onClose={() => setDropModalOpen(false)}
              onConfirm={handleConfirmDrop}
              order={pendingOrder}
              initialDate={pendingDate}
              fixedDate={pendingDate}
            />
            <Scheduler data={appointments} locale="fr-FR" className="h-full">
              <ViewState
                currentDate={currentDate.toISOString().split("T")[0]}
              />
              <EditingState onCommitChanges={commitChanges} />
              <IntegratedEditing />
              {view === "day" && (
                <DayView
                  startDayHour={8}
                  endDayHour={18}
                  timeTableCellComponent={CustomDayTimeTableCell}
                />
              )}
              {view === "week" && (
                <WeekView
                  startDayHour={8}
                  endDayHour={18}
                  timeTableCellComponent={CustomWeekTimeTableCell}
                />
              )}
              {view === "month" && (
                <MonthView cellComponent={CustomMonthCell} />
              )}
              <Toolbar />
              <Appointments appointmentContentComponent={AppointmentContent} />
              <DragDropProvider />
              <AppointmentTooltip
                showCloseButton
                showOpenButton
                showDeleteButton
              />
              <AppointmentForm />
            </Scheduler>
          </Box>
        </Paper>
      </Box>

      {/* Modal calendrier */}
      <Dialog
        open={openCalendarDialog}
        onClose={() => setOpenCalendarDialog(false)}
      >
        <DialogTitle>Choisir une date</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={currentDate}
              onChange={(newValue) => newValue && setCurrentDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCalendarDialog(false)}>Annuler</Button>
          <Button onClick={() => setOpenCalendarDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
