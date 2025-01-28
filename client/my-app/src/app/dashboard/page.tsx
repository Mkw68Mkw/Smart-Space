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
        const response = await fetch("http://localhost:8080/api/protected", {
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
        const response = await fetch("http://localhost:8080/api/reservations", {
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
    <div className="min-h-full">
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
      <div className="flex flex-col justify-center items-center flex-grow mt-10">
        {" "}
        {/* Container für die Box */}
        <div className="w-[400px] bg-gray-50 flex flex-col text-center p-4 rounded-lg shadow-md gap-4 al justify-center items-center">
          <h1 className="font-bold text-2xl">Willkommen im Dashboard</h1>
          {user ? ( // wenn User vorhanden
            <div>
              <h2 className="text-xl">Eingeloggt als: {user}</h2>
              <p>{message}</p>
            </div>
          ) : (
            // wenn nicht
            <p>Lade Benutzerinformationen...</p>
          )}
          <Button onClick={handleLogout}>Abmelden</Button>
        </div>
      </div>
      {/* Reservierungen anzeigen */}
      <h2>Deine Reservierungen:</h2>

      <Table className="p-50">
        <TableCaption>Deine Reservierungen</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Raum</TableHead>
            <TableHead>Zweck</TableHead>
            <TableHead>Startzeit</TableHead>
            <TableHead>Endzeit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.length > 0 ? (
            reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">
                  {reservation.room_name}
                </TableCell>
                <TableCell>{reservation.Zweck}</TableCell>
                <TableCell>{reservation.Startzeit}</TableCell>
                <TableCell>{reservation.Endzeit}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4}>Keine Reservierungen gefunden.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default Dashboard;