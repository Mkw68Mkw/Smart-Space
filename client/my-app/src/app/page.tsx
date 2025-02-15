/* eslint-disable */
// ... gesamter Code der Datei ...
"use client";
import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react"; // React-Komponente von FullCalendar
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction"; // für Drag & Drop-Funktionalität (optional)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Importiere die Dialog-Komponenten
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Fügen Sie diesen Import hinzu
import { format } from "date-fns";
import { Building, CalendarCheck, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import deLocale from '@fullcalendar/core/locales/de';

interface Resource {
  id: string;
  title: string;
}

interface CalendarEvent {
  id: string;
  resourceId: string;
  title: string;
  start: Date;
  end: Date;
}

const ResourceCalendar: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]); // Zustand für Ressourcen
  const [events, setEvents] = useState<CalendarEvent[]>([]); // Zustand für Events
  const [isModalOpen, setIsModalOpen] = useState(false); // Zustand für den Modal
  const [selectedEvent, setSelectedEvent] = useState<{
    startdate: Date;
    enddate: Date;
    roomId: string;
    roomName: string;
  } | null>(null); // Zustand für das ausgewählte Event
  const [purpose, setPurpose] = useState(""); // Zustand für Zweck der Buchung
  const router = useRouter();
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [manualRoom, setManualRoom] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");

  // Funktion zum Abrufen der Räume vom Backend
  const fetchResources = async () => {
    try {
      const response = await fetch("https://roomreservation-flaskserver.onrender.com/api/rooms"); // Deine Backend-URL
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
        //"http://localhost:8080/api/reservations_withoutAuth",
        "https://roomreservation-flaskserver.onrender.com/api/reservations_withoutAuth",
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
        start: new Date(
          new Date(reservation.Startzeit).getTime() - 
          new Date(reservation.Startzeit).getTimezoneOffset() * 60000
        ),
        end: new Date(
          new Date(reservation.Endzeit).getTime() - 
          new Date(reservation.Endzeit).getTimezoneOffset() * 60000
        ),
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
        const response = await fetch("https://roomreservation-flaskserver.onrender.com/api/protected", {
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

  // Mobile-Erkennung im useEffect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Neue Submit-Funktion
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRoom || !manualStart || !manualEnd) return;

    const selectedRoom = resources.find(r => r.id === manualRoom);
    
    setSelectedEvent({
      startdate: new Date(manualStart),
      enddate: new Date(manualEnd),
      roomId: manualRoom,
      roomName: selectedRoom?.title || "Unbekanntes Zimmer",
    });
    setIsModalOpen(true);
  };

  // Funktion zum Handhaben der Auswahl
  const handleSelect = async (selectInfo: any) => {
    const existingEvents = calendarRef.current?.getApi()?.getEvents();
    const newStart = selectInfo.start;
    const newEnd = selectInfo.end;
    const newRoomId = selectInfo.resource?.id;

    const hasOverlap = existingEvents?.some(event => {
      return event.getResources()[0].id === newRoomId && 
             event.start! < newEnd && 
             event.end! > newStart;
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
    event.preventDefault();

    // Speichere die Reservierungsdaten ZUERST
    if (selectedEvent) {
      const reservationData = {
        startdate: selectedEvent.startdate,
        enddate: selectedEvent.enddate,
        roomId: selectedEvent.roomId,
        roomName: selectedEvent.roomName,
        purpose,
      };

      localStorage.setItem("reservationData", JSON.stringify(reservationData));
      console.log("Reservierungsdaten gespeichert:", reservationData);
    }

    // Überprüfe das Token NACH dem Speichern
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Wenn eingeloggt, weiter zum Checkout
    router.push("/checkout");
  };

  // Logout-Funktion
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
              <Building className="h-8 w-8 text-white" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">SmartSpace</h1>
            </div>
            
            {jwtToken && user ? (
              <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                <div className="flex items-center gap-2 order-first">
                  <span className="bg-white/10 p-2 rounded-lg hidden sm:inline-flex">
                    <CalendarCheck className="h-5 w-5" />
                  </span>
                  <span className="font-medium text-sm md:text-base truncate max-w-[120px] md:max-w-none">
                    {user}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href="/dashboard" className="flex-1">
                    <Button 
                      variant="ghost" 
                      className="hover:bg-white/10 text-white text-sm md:text-base px-3 py-1 md:px-4 md:py-2"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleLogout}
                    variant="ghost"
                    className="hover:bg-white/10 text-sm md:text-base px-3 py-1 md:px-4 md:py-2"
                  >
                    Abmelden
                  </Button>
                </div>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-blue-600 hover:bg-white/90 text-sm md:text-base px-3 py-1 md:px-4 md:py-2">
                  Anmelden
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-4xl font-bold mb-4">Finden Sie den perfekten Raum</h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Modern ausgestattete Räume für Meetings, Workshops und Events - 
              einfach buchen und sofort verfügbar
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Formular - Responsive Optimierungen */}
      {isMobile && (
        <div className="md:hidden p-4 bg-white border-b shadow-sm">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid gap-4">
              <select
                value={manualRoom}
                onChange={(e) => setManualRoom(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Raum auswählen</option>
                {resources.map(room => (
                  <option key={room.id} value={room.id} className="text-gray-700">
                    {room.title}
                  </option>
                ))}
              </select>
              
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="datetime-local"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500"
                  required
                />
                
                <input
                  type="datetime-local"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-base font-medium transition-colors"
            >
              Verfügbarkeit prüfen
            </Button>
          </form>
        </div>
      )}

      {/* Calendar Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-20">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">
                Echtzeit-Belegungsplan
              </h3>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="rounded-lg"
                onClick={() => {
                  if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi()
                    calendarApi.today() // Zur aktuellen Datumsansicht springen
                    calendarApi.changeView('resourceTimelineDay') // Standardansicht wiederherstellen
                  }
                }}
              >
                Heute
              </Button>
            </div>
          </div>

          <FullCalendar
            plugins={[resourceTimelinePlugin, interactionPlugin]}
            initialView="resourceTimelineDay"
            locales={[deLocale]}
            locale="de"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              meridiem: false
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            resources={resources}
            events={events}
            selectable={true}
            select={handleSelect}
            headerToolbar={{
              left: "prev,next",
              center: "title",
              right: "resourceTimelineDay,resourceTimelineWeek",
            }}
            height="auto"
            ref={calendarRef}
            eventContent={(eventInfo) => (
              <div className="fc-event-main-frame">
                <div className="fc-event-title-container">
                  <div className="fc-event-title bg-blue-100/80 text-blue-800 px-2 py-1 rounded text-sm">
                    {eventInfo.event.title}
                  </div>
                </div>
              </div>
            )}
            selectMirror={true}
            //responsive={true}
            eventClick={(clickInfo) => {
              setSelectedEvent({
                startdate: clickInfo.event.start,
                enddate: clickInfo.event.end,
                roomId: clickInfo.event.getResources()[0]?.id,
              });
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Star className="h-8 w-8" />,
                title: "Einfache Buchung",
                text: "Intuitive Oberfläche für schnelle Reservierungen"
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Echtzeit-Update",
                text: "Aktuelle Verfügbarkeit immer im Blick"
              },
              {
                icon: <Building className="h-8 w-8" />,
                title: "Moderne Räume",
                text: "Top-ausgestattet für jeden Anlass"
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 bg-gray-50 rounded-xl hover:bg-white transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-600 text-white p-3 rounded-lg">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-semibold">{feature.title}</h4>
                </div>
                <p className="text-gray-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog Section (existing with visual enhancements) */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-md p-8 rounded-2xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <DialogHeader>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl -m-6 mb-6">
              <DialogTitle className="text-2xl font-bold">
                Reservierung bestätigen
              </DialogTitle>
            </div>
          </DialogHeader>
          
          {selectedEvent && (
            <form onSubmit={reserveRoom} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zeitraum
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-700 font-medium">
                      {format(selectedEvent.startdate, "dd.MM.yyyy HH:mm")} -{" "}
                      {format(selectedEvent.enddate, "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                    Zweck der Buchung
                  </label>
                  <input
                    id="purpose"
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
                    placeholder="z.B. Teammeeting, Präsentation..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors duration-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors duration-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Weiter zum Checkout
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
