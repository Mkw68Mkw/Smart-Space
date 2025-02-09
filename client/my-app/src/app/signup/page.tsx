"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    // Basis-Validierung
    if (!username || !password || !confirmPassword) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    try {
      const response = await fetch("https://roomreservation-flaskserver.onrender.com/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Token speichern
        localStorage.setItem("access_token", data.access_token);
        
        toast.success("Registrierung erfolgreich!");
        
        // Überprüfe ob Reservierungsinformationen existieren
        const storedReservation = localStorage.getItem("reservationData");
        if (storedReservation) {
          router.push("/checkout");
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(data.msg || "Registrierung fehlgeschlagen");
      }
    } catch (error) {
      console.error("Fehler bei der Registrierung:", error);
      toast.error("Ein Fehler ist aufgetreten");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Zurück zum Login
        </Button>
      </div>

      <div className="w-[380px] bg-white flex flex-col p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="font-bold text-3xl text-gray-900 mb-2">Konto erstellen</h1>
          <p className="text-gray-500">Erstellen Sie ein neues Konto</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Benutzername</label>
            <Input
              placeholder="Wählen Sie einen Benutzernamen"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Passwort</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Passwort bestätigen</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button 
            variant="default"
            onClick={handleSignup}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
          >
            Registrieren
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Bereits ein Konto?{" "}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Anmelden
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
