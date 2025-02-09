"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Building, CalendarClock, ClipboardList } from "lucide-react";

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
      const response = await fetch("https://roomreservation-flaskserver.onrender.com/api/reserve", {
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Reservierungsübersicht</h2>
      {jwtToken ? (
        <div className="space-y-8">
          {reservation ? (
            <form onSubmit={handleReservationSubmit} className="space-y-8">
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Raumdetails</h3>
                </div>
                <p className="text-lg text-gray-700">
                  {reservation.roomName}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarClock className="h-6 w-6 text-blue-600" />
                    <h4 className="text-lg font-medium text-gray-900">Zeitraum</h4>
                  </div>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Von</dt>
                      <dd className="font-medium text-gray-900">
                        {format(new Date(reservation.startdate), "dd.MM.yyyy HH:mm")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Bis</dt>
                      <dd className="font-medium text-gray-900">
                        {format(new Date(reservation.enddate), "dd.MM.yyyy HH:mm")}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <ClipboardList className="h-6 w-6 text-purple-600" />
                    <h4 className="text-lg font-medium text-gray-900">Buchungsdetails</h4>
                  </div>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Zweck</dt>
                      <dd className="font-medium text-gray-900">{reservation.purpose}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-emerald-100"
              >
                Reservierung bestätigen
              </button>
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
