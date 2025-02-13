"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ReservationData {
  id: string;
  startdate: string;
  enddate: string;
  roomName: string;
}

const ConfirmationPage: React.FC = () => {
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Reservierungsinformationen abrufen
    const storedReservation = localStorage.getItem("finalReservationData");
    if (storedReservation) {
      const reservationData = JSON.parse(storedReservation);
      setReservation(reservationData);
    } else {
      router.push("/"); // Wenn keine Reservierungsdaten vorhanden sind, zurück zur Startseite
    }

    // Aufräumarbeiten bei Komponentenausblendung
    return () => {
      localStorage.removeItem("finalReservationData");
    };
  }, [router]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Reservierungsbestätigung</h2>
      {reservation ? (
        <div>
          <p>
            <strong>Zimmer:</strong> {reservation.roomName}
          </p>
          <p>
            <strong>Startdatum:</strong> {new Date(reservation.startdate).toLocaleString()}
          </p>
          <p>
            <strong>Enddatum:</strong> {new Date(reservation.enddate).toLocaleString()}
          </p>
          <p>
            <strong>Zweck der Buchung:</strong> {reservation.purpose}
          </p>
          <p>
            <strong>JWT Token:</strong> {reservation.token}
          </p>
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Zurück zur Startseite
            </button>
          </div>
        </div>
      ) : (
        <p>Es wurden keine Reservierungsdaten gefunden.</p>
      )}
    </div>
  );
};

export default ConfirmationPage;
