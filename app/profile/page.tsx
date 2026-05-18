"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ProfileSetupPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

useEffect(() => {
  fetch("/api/auth/me")
    .then(res => res.json())
    .then(data => {
      console.log("me response:", data); // ✅ browser console'a bak
      setUser(data.user);
    });
}, []);

  const saveProfile = async () => {
    if (!isValidPhone(phone)) {
      setMessage("Telefon 05XXXXXXXXX formatında olmalı");
      return;
    }
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone
      }),
    });

    const data = await res.json();

    if (data.success) {
      router.push("/dashboard");
    }
  };

  const isValidPhone = (phone: string) => {
    return /^05\d{9}$/.test(phone);
  };

  return (
    <div style={{ maxWidth: 500, margin: "50px auto" }}>
      <h1>Profil Bilgileri</h1>

      <input
        placeholder="Ad Soyad"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: 12, marginTop: 10 }}
      />

      <input
        placeholder="Telefon (05xxxxxxxxx)"
        value={phone}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9]/g, "");
          setPhone(value);
        }}
        maxLength={11}
        style={{ width: "100%", padding: 12, marginTop: 10 }}
      />

      <button
        onClick={saveProfile}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 20,
        }}
      >
        Kaydet
      </button>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  );
}