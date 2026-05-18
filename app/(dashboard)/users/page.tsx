"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../component/breadcrumb";

type User = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  apartmentNumber: string | null;
};

function getInitials(name: string | null) {
  if (!name) return "??";
  return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
}

function maskName(name: string | null) {
  if (!name) return "—";
  if (name.length <= 3) return name;
  return name.slice(0, 3) + "*".repeat(name.length - 3);
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: "relative", cursor: "default" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: "absolute", bottom: "120%", left: 0,
          background: "#333", color: "white", padding: "4px 8px",
          borderRadius: 4, fontSize: 12, whiteSpace: "nowrap", zIndex: 10,
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

const emptyForm = { email: "", password: "", name: "", phone: "", role: "RESIDENT", apartmentNumber: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadUsers = () => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (data.error) { router.push("/login"); return; }
        setUsers(data.users);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({
      email: user.email,
      password: "",
      name: user.name || "",
      phone: user.phone || "",
      role: user.role,
      apartmentNumber: user.apartmentNumber || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    if (editUser) {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          role: form.role,
          apartmentNumber: form.apartmentNumber,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
    } else {
      if (!form.email || !form.password) { setError("Email ve şifre zorunlu"); return; }
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
    }
    setShowModal(false);
    loadUsers();
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <Breadcrumb items={[{ label: "Dashboard", url: "/dashboard" }, { label: "Kullanıcılar" }]} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Kullanıcılar</h1>
        <button onClick={openAdd} style={{ padding: "8px 16px", background: "#534AB7", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          + Yeni Kullanıcı
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#888", fontSize: 14 }}>Yükleniyor...</p>
      ) : (
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #eee", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                <th style={th}>ID</th>
                <th style={th}>Resim</th>
                <th style={th}>Ad Soyad</th>
                <th style={th}>E-Posta</th>
                <th style={th}>Telefon</th>
                <th style={th}>Daire No</th>
                <th style={th}>Tipi</th>
                <th style={th}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>Henüz kullanıcı yok</td></tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #f0f0f0", background: index % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={td}>{user.id}</td>
                    <td style={td}>
                      {user.name ? (
                        <Tooltip text={user.name}>
                          <span>{maskName(user.name)}</span>
                        </Tooltip>
                      ) : <span style={{ color: "#ccc" }}>—</span>}
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "#CECBF6", display: "flex", alignItems: "center",
                          justifyContent: "center", fontWeight: 600, fontSize: 11,
                          color: "#3C3489", flexShrink: 0,
                        }}>
                          {getInitials(user.name)}
                        </div>
                        {user.name ? (
                          <Tooltip text={user.name}>
                            <span>{maskName(user.name)}</span>
                          </Tooltip>
                        ) : <span style={{ color: "#ccc" }}>—</span>}
                      </div>
                    </td>
                    <td style={td}>{user.email}</td>
                    <td style={td}>{user.phone || <span style={{ color: "#ccc" }}>—</span>}</td>
                    <td style={td}>{user.apartmentNumber || <span style={{ color: "#ccc" }}>—</span>}</td>
                    <td style={td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                        background: user.role === "ADMIN" ? "#EEEDFE" : "#f0f0f0",
                        color: user.role === "ADMIN" ? "#534AB7" : "#555",
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={td}>
                      <button onClick={() => openEdit(user)} style={actionBtn}>Düzenle</button>
                      <button disabled style={{ ...actionBtn, color: "#ccc", borderColor: "#eee", cursor: "not-allowed" }}>Sil</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 28, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              {editUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
            </h2>

            {!editUser && (
              <>
                {field("Email", "email", form, setForm, "email")}
                {field("Şifre", "password", form, setForm, "password")}
              </>
            )}
            {field("Ad Soyad", "name", form, setForm)}
            {field("Telefon", "phone", form, setForm)}
            {field("Daire No", "apartmentNumber", form, setForm)}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Rol</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
              >
                <option value="RESIDENT">RESIDENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ ...actionBtn, padding: "8px 16px" }}>İptal</button>
              <button onClick={handleSave} style={{ padding: "8px 16px", background: "#534AB7", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function field(
  label: string,
  key: string,
  form: any,
  setForm: any,
  type = "text"
) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
      />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, color: "#555", marginBottom: 5, fontWeight: 500,
};

const th: React.CSSProperties = {
  padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12,
};

const td: React.CSSProperties = {
  padding: "10px 16px", color: "#333",
};

const actionBtn: React.CSSProperties = {
  padding: "4px 10px", fontSize: 12, border: "1px solid #ddd",
  borderRadius: 4, cursor: "pointer", background: "transparent", marginRight: 6, color: "#555",
};