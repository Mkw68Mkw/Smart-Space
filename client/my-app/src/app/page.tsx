"use client";
import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react"; // React-Komponente von FullCalendar
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction"; // für Drag & Drop-Funktionalität (optional)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Importiere die Dialog-Komponenten
import { useRouter } from "next/navigation";
import { link } from "fs";
import { toast } from "sonner"; // Fügen Sie diesen Import hinzu

const ResourceCalendar: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]); // Zustand für Ressourcen
  const [events, setEvents] = useState<any[]>([]); // Zustand für Events
  const [isModalOpen, setIsModalOpen] = useState(false); // Zustand für den Modal
  const [selectedEvent, setSelectedEvent] = useState<any>(null); // Zustand für das ausgewählte Event
  const [purpose, setPurpose] = useState(""); // Zustand für Zweck der Buchung
  const router = useRouter();
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const calendarRef = useRef(null);

  // Funktion zum Abrufen der Räume vom Backend
  const fetchResources = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/rooms"); // Deine Backend-URL
      if (!response.ok) {
        throw new Error("Netzwerkantwort war nicht ok");
      }
      const data = await response.json(); // Konvertiere die Antwort in JSON

      // Ressourcen im gewünschten Format transformieren
      const formattedResources = data.rooms.map((room: any) => ({
        id: room.id.toString(), // ID in einen String umwandeln
        title: `${room.name} (${room.location})`, // Raumname und Standortname
      }));

      setResources(formattedResources); // Setze die Ressourcen in den Zustand
    } catch (error) {
      console.error("Fehler beim Abrufen der Zimmer:", error);
    }
  };

  // Funktion zum Abrufen der Reservierungen ohne Authentifizierung
  const fetchEvents = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/reservations_withoutAuth",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      ); // Deine Backend-URL
      if (!response.ok) {
        throw new Error("Netzwerkantwort war nicht ok");
      }

      const data = await response.json(); // Konvertiere die Antwort in JSON
      console.log(data.reservations); // Debugging

      // Events im gewünschten Format transformieren
      const formattedEvents = data.reservations.map((reservation: any) => ({
        id: reservation.id.toString(), // ID in einen String umwandeln
        resourceId: reservation.room_id.toString(), // resourceId setzen
        title: "", // Zweck der Reservierung
        start: reservation.Startzeit, // Startzeit der Reservierung
        end: reservation.Endzeit, // Endzeit der Reservierung
      }));

      setEvents(formattedEvents); // Setze die Events in den Zustand
    } catch (error) {
      console.error("Fehler beim Abrufen der Reservierungen:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isFirstVisit = localStorage.getItem("isFirstVisit");
      if (!isFirstVisit) {
        // localStorage leeren
        localStorage.clear();
        // Setze Flag für den ersten Besuch
        localStorage.setItem("isFirstVisit", "true");
      }
    }
    
    fetchResources(); // Rufe die Funktion zum Abrufen der Ressourcen auf
    fetchEvents(); // Rufe die Funktion zum Abrufen der Events auf

    // JWT-Token abrufen
    const token = localStorage.getItem("access_token");
    setJwtToken(token);

    // Geschützte Daten vom Backend abrufen
    const getProtectedData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/protected", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Token im Header senden
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.logged_in_as); // Benutzername speichern
        } else {
          console.error("Zugriff verweigert: Ungültiger Token");
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der geschützten Daten:", error);
      }
    };

    getProtectedData();
  }, []);

  // Funktion zum Handhaben der Auswahl
  const handleSelect = async (selectInfo: any) => {
    const existingEvents = calendarRef.current?.getApi().getEvents();
    const newStart = selectInfo.start;
    const newEnd = selectInfo.end;
    const newRoomId = selectInfo.resource.id;

    const hasOverlap = existingEvents?.some(event => {
      return event.getResources()[0].id === newRoomId && 
             event.start < newEnd && 
             event.end > newStart;
    });

    if (hasOverlap) {
      toast.error("Zeitraum nicht verfügbar", {
        description: "Dieser Raum ist im gewählten Zeitraum bereits reserviert.",
        position: "top-center",
        duration: 3000,
      });
      return;
    }

    // Wenn keine Überschneidung, fahre normal fort
    const selectedRoom = resources.find((room) => room.id === newRoomId);
    
    setSelectedEvent({
      startdate: newStart,
      enddate: newEnd,
      roomId: newRoomId,
      roomName: selectedRoom ? selectedRoom.title : "Unbekanntes Zimmer",
    });
    setIsModalOpen(true);
  };

  // Funktion zum Schließen des Dialogs
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Funktion zum Reservieren des Zimmers
  const reserveRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Verhindere das Standardverhalten des Formulars

    const token = localStorage.getItem("access_token");
    if (!token) {
      // Wenn kein Token vorhanden ist, leite den Benutzer zur Login-Seite weiter
      router.push("/login");
      return;
    }

    // Reservierungsdaten für späteren Zugriff speichern
    if (selectedEvent) {
      const reservationData = {
        startdate: selectedEvent.startdate,
        enddate: selectedEvent.enddate,
        roomId: selectedEvent.roomId,
        roomName: selectedEvent.roomName,
        purpose,
      };

      // Speichere die Reservierungsdaten in localStorage
      localStorage.setItem("reservationData", JSON.stringify(reservationData));
      console.log("Reservierungsdaten gespeichert:", reservationData);
    }
    // Leite den Benutzer zur Login-Seite weiter
    router.push("/checkout");
  };

  // Logout-Funktion
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.reload();
  };

  return (
    <div className="p-5 bg-white rounded-lg shadow-md">
      {/* Header Section */}
<div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold text-gray-800">Raumplaner</h1>
  {jwtToken && user ? (
    <div className="flex items-center space-x-4">
      <h2 className="text-xl text-gray-700">Willkommen, {user}</h2>
      <a href="/dashboard">
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Dashboard
        </button>
      </a>
      <button 
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Logout
      </button>
    </div>
  ) : (
    <a href="/login">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
        Login
      </button>
    </a>
  )}
</div>

      {/* Calendar Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay"
          resources={resources} // Ressourcen aus dem Zustand
          events={events} // Events aus dem Zustand
          selectable={true}
          select={handleSelect}
          eventDrop={(info) =>
            console.log(
              `Event dropped: ${info.event.title} to ${info.event.start}`
            )
          }
          resourceAreaHeaderContent="Rooms"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "resourceTimelineDay,resourceTimelineWeek",
          }}
          height="auto"
          ref={calendarRef}
        />
      </div>

      {/* Dialog Section */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-md p-6 rounded-lg">
          {selectedEvent && (
            <form onSubmit={reserveRoom} className="space-y-4">
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                  Zweck der Buchung:
                </label>
                <input
                  id="purpose"
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Reservieren
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourceCalendar;
