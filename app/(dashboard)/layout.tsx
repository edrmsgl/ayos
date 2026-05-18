"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const menuGroups = [
  {
    label: "YÖNETİM",
    items: [
      { name: "Binalar", icon: "ti-building", url: "/buildings" },
      { name: "Daireler", icon: "ti-door", url: "/apartments" },
      { name: "Sakinler", icon: "ti-users", url: "/residents" },
      { name: "Kullanıcılar", icon: "ti-user-circle", url: "/users" },
    ],
  },
  {
    label: "FİNANS",
    items: [
      { name: "Aidatlar", icon: "ti-receipt", url: "/dues" },
      { name: "Gelirler", icon: "ti-trending-up", url: "/income" },
      { name: "Giderler", icon: "ti-trending-down", url: "/expenses" },
    ],
  },
  {
    label: "DİĞER",
    items: [
      { name: "Görevler", icon: "ti-checkbox", url: "/tasks" },
      { name: "Duyurular", icon: "ti-speakerphone", url: "/announcements" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loginTime, setLoginTime] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          router.push("/login");
          return;
        }
        setProfile(data.profile);
      })
      .catch(() => router.push("/login"));
  }, []);

  useEffect(() => {
  fetch("/api/auth/me")
    .then(res => res.json())
    .then(data => {
      if (data.user?.loginTime) {
        const date = new Date(data.user.loginTime);
        setLoginTime(
          date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
          + ", "
          + date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
        );
      }
    });
}, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  if (!profile) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "#888" }}>Yükleniyor...</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>

      {/* Topbar */}
      <div style={{ background: "white", borderBottom: "1px solid #eee", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>AYOS</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Hoş geldin, <strong>{profile.name}</strong></div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              @ {profile.email} - 🕐 {loginTime}
            </div>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "#CECBF6", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: 600, fontSize: 13,
            color: "#3C3489", position: "relative", flexShrink: 0,
          }}>
            {initials}
            <span style={{
              position: "absolute", bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: "50%",
              background: "#16a34a", border: "2px solid white",
            }} />
          </div>
          <button
            onClick={handleLogout}
            style={{ padding: "7px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>

        {/* Sidebar */}
        <div style={{ width: 200, background: "white", borderRight: "1px solid #eee", padding: "16px 0", flexShrink: 0, position: "sticky", top: 65, alignSelf: "flex-start", height: "calc(100vh - 65px)", overflowY: "auto" }}>
          {menuGroups.map(group => (
            <div key={group.label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#aaa", padding: "0 16px", marginBottom: 6, letterSpacing: "0.8px" }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const isActive = pathname === item.url;
                return (
                  <Link
                    key={item.name}
                    href={item.url}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 16px", fontSize: 13, cursor: "pointer",
                      borderLeft: isActive ? "2px solid #534AB7" : "2px solid transparent",
                      background: isActive ? "#EEEDFE" : "transparent",
                      color: isActive ? "#534AB7" : "#555",
                      textDecoration: "none",
                    }}
                  >
                    <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24 }}>
          {children}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "white", borderTop: "1px solid #eee", padding: "12px 24px", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#aaa" }}>© 2026 AYOS - Apartman Yönetim Otomasyon Sistemi</span>
        <span style={{ fontSize: 12, color: "#aaa" }}>v1.0.0</span>
      </div>

    </div>
  );
}