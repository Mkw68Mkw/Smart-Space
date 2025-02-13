"use client"; 
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch("https://roomreservation-flaskserver.onrender.com/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }), // Sende Username und Password als JSON
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Login erfolgreich! JWT Token:", data.access_token);
        
        // JWT im localStorage speichern
        localStorage.setItem("access_token", data.access_token); 

        // Admin-Check vor der Reservierungsprüfung
        if (username === "admin") {
          router.push("/admin");
          return; // Frühes Return um weitere Checks zu überspringen
        }

        // Überprüfe, ob Reservierungsinformationen existieren
        const storedReservation = localStorage.getItem("reservationData");
        if (storedReservation) {
          // Falls vorhanden, leite zur Checkout-Seite weiter
          router.push("/checkout");
        } else {
          // Wenn keine Reservierung vorhanden ist, leite zum Dashboard weiter
          router.push("/dashboard");
        }
      } else {
        console.error("Login fehlgeschlagen");
        alert("Login fehlgeschlagen, bitte prüfe deine Anmeldedaten.");
      }
    } catch (error) {
      console.error("Fehler beim Login:", error);
      alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Zurück
        </Button>
      </div>

      <div className="w-full max-w-[380px] px-4">
        <div className="bg-white flex flex-col p-6 md:p-8 rounded-2xl shadow-lg w-full">
          <div className="text-center mb-8">
            <h1 className="font-bold text-3xl text-gray-900 mb-2">Willkommen zurück</h1>
            <p className="text-gray-500">Bitte melden Sie sich an, um fortzufahren</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Benutzername</label>
              <Input
                placeholder="Geben Sie Ihren Benutzernamen ein"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Passwort</label>
              <Input
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button 
              variant="default" 
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            >
              Anmelden
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Noch kein Konto?</span>
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full border-gray-200 hover:bg-gray-50 text-gray-700"
              onClick={() => router.push('/signup')}
            >
              Konto erstellen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
