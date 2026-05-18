"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    try {
      setError("");

      if (!email || !password) {
        setError("E-Posta ve şifre zorunludur");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Giriş başarısız");
        return;
      }

      router.push(data.redirect);

    } catch (err) {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f4f4",
      }}
    >
      <div
        style={{
          width: 350,
          background: "white",
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1>Üye Girişi</h1>

        <input
          placeholder="E-Posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 10,
          }}
        />

        <input
          placeholder="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 10,
          }}
        />

        {error && (
          <p
            style={{
              color: "red",
              marginTop: 10,
            }}
          >
            {error}
          </p>
        )}

        <button
          style={{
            width: "100%",
            padding: 12,
            marginTop: 20,
            cursor: "pointer",
          }}
          onClick={login}
          disabled={loading}
        >
          {loading ? "Giriş yapılıyor..." : "Üye Girişi"}
        </button>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 14 }}>
          Hesabın yok mu?{" "}
          <a href="/register" style={{ color: "#2563eb", textDecoration: "none" }}>
            Üye Ol
          </a>
        </p>
      </div>
    </div>
  );
}