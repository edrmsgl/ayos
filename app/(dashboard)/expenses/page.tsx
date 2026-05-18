"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "../../component/breadcrumb";

type Category = { id: number; name: string; icon: string | null };
type Expense = {
  id: number;
  amount: number;
  date: string;
  description: string | null;
  supplier: string | null;
  payment_method: string | null;
  period: string | null;
  status: string;
  category: Category | null;
  user: { id: number; name: string | null } | null;
  invoice_no: string;
};

const emptyExpense = {
  category_id: "",
  amount: "",
  date: "",
  description: "",
  supplier: "",
  payment_method: "",
  period: "one-time",
  status: "PENDING",
  invoice_no: "",
};

const statusLabel: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "Bekliyor", bg: "#FEF3C7", color: "#92400E" },
  PAID: { label: "Ödendi", bg: "#D1FAE5", color: "#065F46" },
  CANCELLED: { label: "İptal", bg: "#FEE2E2", color: "#991B1B" },
};

function CategoryBadge({ cat, onEdit, onDelete }: {
  cat: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", display: "inline-flex", alignItems: "center", gap: 8,
        padding: "5px 12px",
        background: hover ? "#EEEDFE" : "#f5f5f5",
        borderRadius: 20, fontSize: 13, cursor: "default",
        border: hover ? "1px solid #C4C0F0" : "1px solid transparent",
        zIndex: hover ? 10 : 1, // ✅ hover'da üste çık
      }}
    >
      <span style={{ color: hover ? "#534AB7" : "#333" }}>{cat.name}</span>
      <span style={{
        display: "flex", gap: 4,
        visibility: hover ? "visible" : "hidden", // ✅ display yerine visibility
        width: hover ? "auto" : 0,
        overflow: "hidden",
      }}>
        <button
          onMouseDown={e => { e.stopPropagation(); onEdit(); }} // ✅ onMouseDown kullan
          style={{ background: "#534AB7", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}
        >
          Düzenle
        </button>
        <button
          onMouseDown={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "#dc2626", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}
        >
          Sil
        </button>
      </span>
    </div>
  );
}
function inp(label: string, key: string, form: any, setForm: any, type = "text") {
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

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "#555", marginBottom: 5, fontWeight: 500 };
const th: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 };
const td: React.CSSProperties = { padding: "10px 16px", color: "#333" };
const actionBtn: React.CSSProperties = { padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", background: "transparent", marginRight: 6, color: "#555" };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyExpense);
  const [catForm, setCatForm] = useState({ name: "", icon: "" });
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => { });
  const [confirmMessage, setConfirmMessage] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = Tümü
  const months = ["Tümü", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const years = [...new Set(expenses.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);
  if (!years.includes(selectedYear)) years.push(selectedYear);

  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    const yearMatch = d.getFullYear() === selectedYear;
    const monthMatch = selectedMonth === 0 || d.getMonth() + 1 === selectedMonth;
    return yearMatch && monthMatch;
  });

  const grouped = filtered.reduce((acc: Record<number, Expense[]>, exp) => {
    const month = new Date(exp.date).getMonth() + 1;
    if (!acc[month]) acc[month] = [];
    acc[month].push(exp);
    return acc;
  }, {});

  const sortedMonths = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/expenses").then(r => r.json()),
      fetch("/api/expenses/categories").then(r => r.json()),
    ]).then(([exp, cat]) => {
      setExpenses(exp.expenses || []);
      setCategories(cat.categories || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const askConfirm = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirm(true);
  };

  const openAdd = () => {
    setEditExpense(null);
    setForm(emptyExpense);
    setError("");
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditExpense(e);
    setForm({
      category_id: String(e.category?.id || ""),
      amount: String(e.amount),
      date: e.date.slice(0, 10),
      description: e.description || "",
      supplier: e.supplier || "",
      payment_method: e.payment_method || "",
      period: e.period || "one-time",
      status: e.status,
      invoice_no: e.invoice_no
      
    });
    setError("");
    setShowModal(true);
  };

  const openAddCategory = () => {
    setEditCategory(null);
    setCatForm({ name: "", icon: "" });
    setError("");
    setShowCatModal(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditCategory(cat);
    setCatForm({ name: cat.name, icon: cat.icon || "" });
    setError("");
    setShowCatModal(true);
  };

  const handleSave = async () => {
    setError("");
    const url = editExpense ? `/api/expenses/${editExpense.id}` : "/api/expenses";
    const method = editExpense ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const data = await res.json();
    if (!data.success) { setError(data.error); return; }
    setShowModal(false);
    load();
  };

  const handleSaveCategory = async () => {
    if (!catForm.name) { setError("Kategori adı zorunlu"); return; }

    if (editCategory) {
      askConfirm(`"${catForm.name}" kategorisini güncellemek istediğinizden emin misiniz?`, async () => {
        const res = await fetch(`/api/expenses/categories/${editCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        setShowConfirm(false);
        setShowCatModal(false);
        load();
      });
      return;
    }

    const res = await fetch("/api/expenses/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    });
    const data = await res.json();
    if (!data.success) { setError(data.error); return; }
    setShowCatModal(false);
    setCatForm({ name: "", icon: "" });
    load();
  };

  const handleDeleteCategory = (id: number) => {
    askConfirm("Bu kategoriyi silmek istediğinizden emin misiniz?", async () => {
      const res = await fetch(`/api/expenses/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { alert(data.error); return; }
      setShowConfirm(false);
      load();
    });
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);

    const formData = new FormData();
    formData.append("file", importFile);

    const res = await fetch("/api/expenses/import", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setImportResult(data.results);
    setImporting(false); // ✅
    if (data.success) load();
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <Breadcrumb items={[{ label: "Dashboard", url: "/dashboard" }, { label: "Giderler" }]} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Giderler</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>


          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ padding: "7px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>


          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{ padding: "7px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>

          <button
            onClick={() => { setImportResult(null); setImportFile(null); setShowImportModal(true); }}
            style={{ padding: "8px 14px", background: "white", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
          >
            📥 Ekstre Yükle
          </button>
          <button onClick={openAddCategory} style={{ padding: "8px 14px", background: "white", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            + Kategori Ekle
          </button>
          <button onClick={openAdd} style={{ padding: "8px 16px", background: "#534AB7", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            + Yeni Gider
          </button>
        </div>
      </div>


      <div style={{ background: "white", borderRadius: 8, border: "1px solid #eee", marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Kategoriler</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 16 }}>
          {categories.map(cat => (
            <CategoryBadge
              key={cat.id}
              cat={cat}
              onEdit={() => openEditCategory(cat)}
              onDelete={() => handleDeleteCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#888", fontSize: 14 }}>Yükleniyor...</p>
      ) : sortedMonths.length === 0 ? (
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #eee", padding: 32, textAlign: "center", color: "#aaa", fontSize: 14 }}>
          Bu dönemde gider bulunamadı
        </div>
      ) : (
        sortedMonths.map(month => {
          const monthExpenses = grouped[month];
          const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

          return (
            <div key={month} style={{ background: "white", borderRadius: 8, border: "1px solid #eee", overflow: "hidden", marginBottom: 20 }}>

              {/* Ay başlığı */}
              <div style={{ padding: "12px 16px", background: "#f9f9f9", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
                  {months[month]} {selectedYear}
                </span>
                <span style={{ fontSize: 13, color: "#534AB7", fontWeight: 600 }}>
                  Toplam: {total.toLocaleString("tr-TR")} ₺
                </span>
              </div>

              {/* Tablo */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <th style={th}>ID</th>
                    <th style={th}>Fatura No</th>
                    <th style={th}>Kategori</th>
                    <th style={th}>Tutar</th>
                    <th style={th}>Tarih</th>
                    <th style={th}>Tedarikçi</th>
                    <th style={th}>Dönem</th>
                    <th style={th}>Durum</th>
                    <th style={th}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {monthExpenses.map((exp, index) => {
                    const s = statusLabel[exp.status] || statusLabel.PENDING;
                    return (
                      <tr key={exp.id} style={{ borderBottom: "1px solid #f0f0f0", background: index % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={td}>{exp.id}</td>
                        <td style={td}>{exp.invoice_no || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={td}>{exp.category?.name || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={td}><strong>{Number(exp.amount).toLocaleString("tr-TR")} ₺</strong></td>
                        <td style={td}>{new Date(exp.date).toLocaleDateString("tr-TR")}</td>
                        <td style={td}>{exp.supplier || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={td}>{exp.period || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={td}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </td>
                        <td style={td}>
                          <button onClick={() => openEdit(exp)} style={actionBtn}>Düzenle</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Ay toplamı */}
                <tfoot>
                  <tr style={{ background: "#f9f9f9", borderTop: "1px solid #eee" }}>
                    <td colSpan={2} style={{ padding: "10px 16px", fontSize: 13, color: "#555", fontWeight: 600 }}>
                      {monthExpenses.length} gider
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#534AB7" }}>
                      {total.toLocaleString("tr-TR")} ₺
                    </td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })
      )}


      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 28, width: 460, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              {editExpense ? "Gider Düzenle" : "Yeni Gider"}
            </h2>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Kategori</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
                <option value="">Seçin...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {inp("Fatura No", "invoice_no", form, setForm)}
            {inp("Tutar (₺)", "amount", form, setForm, "number")}
            {inp("Tarih", "date", form, setForm, "date")}
            {inp("Açıklama", "description", form, setForm)}
            {inp("Tedarikçi", "supplier", form, setForm)}
            {inp("Ödeme Yöntemi", "payment_method", form, setForm)}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Dönem</label>
              <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
                <option value="Tek Seferlik">Tek Seferlik</option>
                <option value="Aylık">Aylık</option>
                <option value="Yıllık">Yıllık</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Durum</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
                <option value="PENDING">Bekliyor</option>
                <option value="PAID">Ödendi</option>
                <option value="CANCELLED">İptal</option>
              </select>
            </div>
            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={actionBtn}>İptal</button>
              <button onClick={handleSave} style={{ padding: "8px 16px", background: "#534AB7", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}


      {showCatModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 28, width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              {editCategory ? "Kategori Düzenle" : "Yeni Kategori"}
            </h2>
            {inp("Kategori Adı", "name", catForm, setCatForm)}
            {inp("İkon (opsiyonel)", "icon", catForm, setCatForm)}
            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCatModal(false)} style={actionBtn}>İptal</button>
              <button onClick={handleSaveCategory} style={{ padding: "8px 16px", background: "#534AB7", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}


      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 28, width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Onay Gerekiyor</h2>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 24, lineHeight: 1.6 }}>{confirmMessage}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "white" }}>
                Vazgeç
              </button>
              <button onClick={() => confirmAction()} style={{ padding: "8px 16px", fontSize: 13, background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
                Evet, Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 28, width: 560, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Ziraat Bankası Ekstre Yükle</h2>
            <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
              Ziraat'ten indirdiğin Excel (.xlsx) dosyasını seç.
              Beklenen format: <code>Tarih | Açıklama | Tutar | Bakiye</code>
            </p>

            {/* Dosya seçici */}
            <div
              onClick={() => document.getElementById("excelInput")?.click()}
              style={{ border: "2px dashed #ddd", borderRadius: 8, padding: 32, textAlign: "center", cursor: "pointer", marginBottom: 16, background: importFile ? "#f0fdf4" : "white" }}
            >
              {importFile ? (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                  <p style={{ fontSize: 13, color: "#16a34a", fontWeight: 500 }}>{importFile.name}</p>
                  <p style={{ fontSize: 12, color: "#888" }}>{(importFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📥</div>
                  <p style={{ fontSize: 13, color: "#555" }}>Excel dosyasını buraya sürükle veya tıkla</p>
                  <p style={{ fontSize: 12, color: "#aaa" }}>.xlsx, .xls desteklenir</p>
                </div>
              )}
              <input
                id="excelInput"
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={e => {
                  setImportFile(e.target.files?.[0] || null);
                  setImportResult(null);
                }}
              />
            </div>

            {importResult && (
              <div style={{ marginTop: 16, padding: 12, background: "#f9f9f9", borderRadius: 6, fontSize: 13 }}>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <span style={{ color: "#16a34a" }}>✅ İçe aktarıldı: <strong>{importResult.matched}</strong></span>
                  <span style={{ color: "#f59e0b" }}>⟳ Atlandı: <strong>{importResult.skipped}</strong></span>
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {importResult.rows.map((row: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #eee", fontSize: 12 }}>
                      <span style={{ color: "#555", flex: 1 }}>{row.description}</span>
                      <span style={{ color: "#888", marginLeft: 8 }}>{row.category}</span>
                      <span style={{ fontWeight: 500, marginLeft: 8 }}>{Number(row.amount).toLocaleString("tr-TR")} ₺</span>
                      <span style={{ marginLeft: 8, color: row.status === "imported" ? "#16a34a" : "#f59e0b" }}>
                        {row.status === "imported" ? "✅ aktarıldı" : "⟳ zaten var"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }} style={actionBtn}>Kapat</button>
              <button
                onClick={handleImport}
                disabled={importing || !importFile}
                style={{ padding: "8px 16px", background: importing || !importFile ? "#94a3b8" : "#534AB7", color: "white", border: "none", borderRadius: 6, cursor: importing || !importFile ? "not-allowed" : "pointer", fontSize: 13 }}
              >
                {importing ? "Yükleniyor..." : "İçe Aktar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}