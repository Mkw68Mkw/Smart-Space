/* eslint-disable */
// ... gesamter Code der Datei ...
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Building, CalendarCheck, Clock, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

// Interface für Reservierungsobjekte definieren
interface Reservation {
  id: string;
  room_name: string;
  Zweck: string;
  Startzeit: string;
  Endzeit: string;
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editPurpose, setEditPurpose] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [sortBy, setSortBy] = useState('newest');
  const router = useRouter();

  // Beim Laden der Komponente den geschützten Inhalt abrufen
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setTimeout(() => {
        router.push("/login");
      }, 3000); // Kein Token? Dann zurück zur Login-Seite
      return;
    }

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
          setMessage(data.msg); // Nachricht setzen
        } else {
          console.error("Zugriff verweigert: Ungültiger Token");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } catch (_error) {
        console.error("Fehler beim Abrufen der geschützten Daten:");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    };

    // Reservierungsdaten abrufen
    const getReservations = async () => {
      try {
        const response = await fetch("https://roomreservation-flaskserver.onrender.com/api/reservations", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Token im Header senden
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReservations(data.reservations); // Reservierungen in den State setzen

          // Reservierungsdaten in der Konsole ausgeben
          console.log("Reservations:", data.reservations);
        } else {
          console.error(
            "Fehler beim Abrufen der Reservierungen: Ungültiger Token oder keine Daten"
          );
        }
      } catch (_error) {
        console.error("Fehler beim Abrufen der Reservierungsdaten:");
      }
    };

    getProtectedData();
    getReservations();
  }, [router]);

  // Logout-Funktion
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const filteredReservations = reservations.filter((reservation: Reservation) => {
    const matchesSearch = reservation.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.Zweck.toLowerCase().includes(searchTerm.toLowerCase());
    
    const currentTime = new Date();
    const startTime = new Date(reservation.Startzeit);
    const endTime = new Date(reservation.Endzeit);
    
    if (filterStatus === "active") return currentTime >= startTime && currentTime <= endTime;
    if (filterStatus === "upcoming") return currentTime < startTime;
    if (filterStatus === "past") return currentTime > endTime;
    
    return matchesSearch;
  });

  // Sortierfunktion hinzufügen
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (sortBy === 'newest') {
      return Number(new Date(b.Startzeit)) - Number(new Date(a.Startzeit));
    } else if (sortBy === 'oldest') {
      return Number(new Date(a.Startzeit)) - Number(new Date(b.Startzeit));
    } else if (sortBy === 'room') {
      return a.room_name.localeCompare(b.room_name);
    }
    return 0;
  });

  //http://localhost:8080/api/reservations_withoutAuth
  //https://roomreservation-flaskserver.onrender.com/api/reservations/

  // Delete reservation
  const handleDelete = async (id: string) => {
    if (confirm("Möchten Sie diese Reservierung wirklich löschen?")) {
      try {
        const response = await fetch(`https://roomreservation-flaskserver.onrender.com/api/reservations/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        
        if (response.ok) {
          setReservations(reservations.filter(r => r.id !== id));
          toast.success("Reservierung gelöscht");
        }
      } catch (error) {
        toast.error("Fehler beim Löschen");
      }
    }
  };

  // Update reservation
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Null-Check hinzufügen
      if (!selectedReservation) {
        toast.error("Keine Reservierung ausgewählt");
        return;
      }

      const response = await fetch(
        `https://roomreservation-flaskserver.onrender.com/api/reservations/${selectedReservation.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            purpose: editPurpose,
            start: editStart,
            end: editEnd,
          }),
        }
      );

      if (response.ok) {
        const updatedReservation = await response.json();
        setReservations(reservations.map(r => 
          r.id === updatedReservation.reservation.id ? updatedReservation.reservation : r
        ));
        setEditModalOpen(false);
        toast.success("Reservierung aktualisiert");
      }
    } catch (error) {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  // Open edit modal
  const openEditModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditPurpose(reservation.Zweck);
    setEditStart(new Date(reservation.Startzeit).toISOString());
    setEditEnd(new Date(reservation.Endzeit).toISOString());
    setEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigationsleiste */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
              <Building className="h-8 w-8 text-white" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                SmartSpace Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/">
                <Button 
                  variant="ghost"
                  className="hover:bg-white/10 text-white text-sm md:text-base px-3 py-1 md:px-4 md:py-2"
                >
                  Zurück zur Übersicht
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Begrüßungsbereich */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <CalendarCheck className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Willkommen zurück, {user}</h1>
              <p className="text-gray-600 mt-2">{message}</p>
            </div>
          </div>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Aktive Reservierungen</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-4">{reservations.length}</p>
          </div>
          
          {/* Weitere Statistik-Karten hier einfügen */}
        </div>

        {/* Filter Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Suche nach Raum oder Zweck..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl bg-white shadow-sm"
          />
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="rounded-xl bg-white shadow-sm">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Reservierungen</SelectItem>
              <SelectItem value="upcoming">Bevorstehende</SelectItem>
              <SelectItem value="past">Vergangene</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="rounded-xl bg-white shadow-sm">
              <SelectValue placeholder="Sortieren nach" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Neueste zuerst</SelectItem>
              <SelectItem value="oldest">Älteste zuerst</SelectItem>
              <SelectItem value="room">Raumname</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservierungstabelle */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Deine Reservierungen</h2>
              </div>
              <span className="text-sm text-gray-500">
                {filteredReservations.length} Einträge gefunden
              </span>
            </div>
          </div>
          
          <Table className="min-w-full">
            <TableHeader className="bg-gray-50">
              <TableRow>
                {["Raum", "Zweck", "Startzeit", "Endzeit"].map((header) => (
                  <TableHead 
                    key={header} 
                    className="px-6 py-4 text-left font-semibold text-gray-900"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody className="divide-y divide-gray-200">
              {sortedReservations.map((reservation) => (
                <TableRow 
                  key={reservation.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="px-6 py-4 font-medium text-gray-900">
                    {reservation.room_name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {reservation.Zweck}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {format(new Date(reservation.Startzeit), "dd.MM.yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600">
                    {format(new Date(reservation.Endzeit), "dd.MM.yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="px-6 py-4 space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(reservation)}
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(reservation.id)}
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {sortedReservations.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              Keine Reservierungen gefunden
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reservierung bearbeiten</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zweck
              </label>
              <Input
                value={editPurpose}
                onChange={(e) => setEditPurpose(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Startzeit
              </label>
              <Input
                type="datetime-local"
                value={editStart.slice(0, 16)}
                onChange={(e) => setEditStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endzeit
              </label>
              <Input
                type="datetime-local"
                value={editEnd.slice(0, 16)}
                onChange={(e) => setEditEnd(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;