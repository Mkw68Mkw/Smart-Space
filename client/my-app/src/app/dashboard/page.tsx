"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [reservations, setReservations] = useState([]);
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
      } catch (error) {
        console.error("Fehler beim Abrufen der geschützten Daten:", error);
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
      } catch (error) {
        console.error("Fehler beim Abrufen der Reservierungsdaten:", error);
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

  return (
    <div className="min-h-full bg-gray-50">
      {/* Navigationsleiste */}
      <nav className="bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8"
                  src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=500"
                  alt="Your Company"
                />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a
                    href="#"
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
                    aria-current="page"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/"
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Calendar
                  </a>
                  <a
                    href="#"
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Reports
                  </a>
                </div>
              </div>
            </div>
            {/* Logout-Button */}
            <div>
              <button
                className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Willkommen zurück, {user}</h1>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Aktive Reservierungen</h3>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{reservations.length}</p>
          </div>
          {/* Weitere Statistik-Karten hier einfügen */}
        </div>

        {/* Verbesserte Tabelle */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Deine Reservierungen</h2>
          </div>
          <Table className="min-w-full divide-y divide-gray-200">
            <TableHeader className="bg-gray-50">
              <TableRow>
                {["Raum", "Zweck", "Startzeit", "Endzeit"].map((header) => (
                  <TableHead 
                    key={header} 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200">
              {reservations.map((reservation) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;