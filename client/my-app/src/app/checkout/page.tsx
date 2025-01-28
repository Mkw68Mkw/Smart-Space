"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CheckoutPage: React.FC = () => {
  const [reservation, setReservation] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Reservierungsinformationen abrufen
    const storedReservation = localStorage.getItem("reservationData");
    if (storedReservation) {
      const reservationData = JSON.parse(storedReservation);
      setReservation(reservationData);
    }

    // JWT-Token abrufen
    const token = localStorage.getItem("access_token");
    setJwtToken(token);

    return () => {
      localStorage.removeItem("reservationData");
    };
  }, []);

  // Funktion zum Absenden der finalen Reservierung mit dem Enddatum und der Endzeit
  const handleReservationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // if (!reservation || !endDate || !endTime || !purpose) {
     // alert("Bitte wählen Sie das Enddatum, die Endzeit und den Zweck aus.");
      //return;
    //}

    // Finales Reservierungsobjekt erstellen
    const finalReservation = {
      start: reservation.startdate, // Startdatum und -zeit setzen
      room_id: reservation.roomId, // room_id aus den Reservierungsdaten
      end: reservation.enddate, // Enddatum und -zeit setzen
      token: jwtToken, // JWT-Token hinzufügen
      purpose: reservation.purpose, // Zweck der Buchung hinzufügen
    };

    console.log("Finale Reservierung:", finalReservation); // Ausgabe in der Konsole

    try {
      // Sende die finale Reservierung an das Backend
      const response = await fetch("http://localhost:8080/api/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`, // JWT-Token anhängen
        },
        body: JSON.stringify(finalReservation),
      });

      if (response.ok) {
        toast.success("Reservierung erfolgreich!", {
          description: "Ihre Reservierung wurde erfolgreich abgeschlossen.",
        });
        router.push("/"); // Weiterleitung zur Bestätigungsseite
      } else {
        toast.error("Reservierung fehlgeschlagen", {
          description: "Bitte versuchen Sie es erneut.",
        });
      }
    } catch (error) {
      console.error("Fehler beim Senden der Reservierung:", error);
      toast.error("Ein Fehler ist aufgetreten", {
        description: "Bitte versuchen Sie es später erneut.",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Deine Reservierung</h2>
      {jwtToken ? (
        <div>
          {reservation ? (
            <form onSubmit={handleReservationSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Zimmer: <span className="font-semibold">{reservation.roomName}</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Startdatum:</p>
                    <p className="font-medium text-gray-800">{reservation.startdate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enddatum:</p>
                    <p className="font-medium text-gray-800">{reservation.enddate}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Zweck:</p>
                  <p className="font-medium text-gray-800">{reservation.purpose}</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Reservierung abschließen
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-600">Keine Reservierungsdaten vorhanden.</p>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Bitte melden Sie sich an, um fortzufahren.</p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Zum Login
          </a>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
