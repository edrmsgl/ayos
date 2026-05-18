"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const passwordRules = [
  {
    id: "length",
    label: "En az 10 karakter",
    test: (p: string) => p.length >= 10,
  },
  {
    id: "upper",
    label: "En az 1 büyük harf",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "En az 1 küçük harf",
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "special",
    label: "En az 1 özel karakter (!@#$%^&*)",
    test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  },
  {
    id: "noSequential",
    label: "Ardışık rakam yok (12, 21, 32, 98...)",
    test: (p: string) => {
      const digits = p.match(/\d+/g);
      if (!digits) return true;
      for (const group of digits) {
        for (let i = 0; i < group.length - 1; i++) {
          const diff = Number(group[i + 1]) - Number(group[i]);
          if (Math.abs(diff) === 1) return false;
        }
      }
      return true;
    },
  },
];

const emailRules = [
  {
    id: "hasAt",
    label: '@ işareti içermeli',
    test: (e: string) => e.includes("@"),
  },
  {
    id: "hasDomain",
    label: "Geçerli uzantı içermeli (.com, .net, .org...)",
    test: (e: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e),
  },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const passwordResults = passwordRules.map(rule => ({
    ...rule,
    passed: rule.test(password),
  }));

  const emailResults = emailRules.map(rule => ({
    ...rule,
    passed: rule.test(email),
  }));

  const allPassed =
    passwordResults.every(r => r.passed) &&
    emailResults.every(r => r.passed);

  const handleSubmit = async () => {
    if (!allPassed) {
      setError("Lütfen tüm koşulları sağlayın");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
       router.push("/profile");
    } else {
      setError(data.error);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: "50px auto", fontFamily: "sans-serif" }}>
      <h1>Üye Ol</h1>

      {/* Email */}
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: "100%", padding: 12, marginTop: 10, boxSizing: "border-box" }}
      />
      {email.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
          {emailResults.map(rule => (
            <li
              key={rule.id}
              style={{
                color: rule.passed ? "#16a34a" : "#dc2626",
                marginBottom: 4,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{rule.passed ? "✅" : "❌"}</span>
              {rule.label}
            </li>
          ))}
        </ul>
      )}

      {/* Şifre */}
      <div style={{ position: "relative", marginTop: 10 }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Şifre"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, paddingRight: 44, boxSizing: "border-box" }}
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          {showPassword ? "🙈" : "👁"}
        </button>
      </div>
      {password.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
          {passwordResults.map(rule => (
            <li
              key={rule.id}
              style={{
                color: rule.passed ? "#16a34a" : "#dc2626",
                marginBottom: 4,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{rule.passed ? "✅" : "❌"}</span>
              {rule.label}
            </li>
          ))}
        </ul>
      )}

      {error && <p style={{ color: "#dc2626", marginTop: 10 }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!allPassed}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 16,
          background: allPassed ? "#2563eb" : "#94a3b8",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: allPassed ? "pointer" : "not-allowed",
          fontSize: 16,
        }}
      >
        Kaydet
      </button>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: 14 }}>
        Zaten hesabın var mı?{" "}
        <a href="/login" style={{ color: "#2563eb", textDecoration: "none" }}>
          Giriş Yap
        </a>
      </p>
    </div>
  );
}