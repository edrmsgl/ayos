"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "../../component/breadcrumb";
import { Modal } from "@/app/component/modal";

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
  invoice_no: string | null;
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
  PENDING:   { label: "Bekliyor", bg: "#FEF3C7", color: "#92400E" },
  PAID:      { label: "Ödendi",   bg: "#D1FAE5", color: "#065F46" },
  CANCELLED: { label: "İptal",    bg: "#FEE2E2", color: "#991B1B" },
};

const supplierMap: Record<string, string> = {
  su: "ASKİ",
  elektrik: "BEDAŞ",
  doğalgaz: "BAŞKENTGAZ",
};

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "#555", marginBottom: 5, fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const th: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 };
const td: React.CSSProperties = { padding: "10px 16px", color: "#333" };
const actionBtn: React.CSSProperties = { padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", background: "transparent", marginRight: 6, color: "#555" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function CategoryBadge({ cat, onEdit, onDelete }: { cat: Category; onEdit: () => void; onDelete: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", display: "inline-flex", alignItems: "center", gap: 8,
        padding: "5px 12px", background: hover ? "#EEEDFE" : "#f5f5f5", borderRadius: 20,
        fontSize: 13, cursor: "default",
        border: hover ? "1px solid #C4C0F0" : "1px solid transparent",
        zIndex: hover ? 10 : 1,
      }}
    >
      <span style={{ color: hover ? "#534AB7" : "#333" }}>{cat.name}</span>
      <span style={{ display: "flex", gap: 4, visibility: hover ? "visible" : "hidden", width: hover ? "auto" : 0, overflow: "hidden" }}>
        <button onMouseDown={e => { e.stopPropagation(); onEdit(); }}
          style={{ background: "#534AB7", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>
          Düzenle
        </button>
        <button onMouseDown={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "#dc2626", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>
          Sil
        </button>
      </span>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  const [showModal,       setShowModal]       = useState(false);
  const [showCatModal,    setShowCatModal]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [editExpense,  setEditExpense]  = useState<Expense | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form,    setForm]    = useState(emptyExpense);
  const [catForm, setCatForm] = useState({ name: "", icon: "" });
  const [error, setError]     = useState("");

  const [confirmAction,  setConfirmAction]  = useState<() => void>(() => () => {});
  const [confirmMessage, setConfirmMessage] = useState("");

  const [importResult, setImportResult] = useState<any>(null);
  const [importing,    setImporting]    = useState(false);
  const [importFile,   setImportFile]   = useState<File | null>(null);

  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [amountDisplay, setAmountDisplay] = useState("");

  const months = ["Tümü","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const years  = [...new Set(expenses.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);
  if (!years.includes(selectedYear)) years.push(selectedYear);

  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === selectedYear && (selectedMonth === 0 || d.getMonth() + 1 === selectedMonth);
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
    setAmountDisplay("");
    setError("");
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditExpense(e);
    setForm({
      category_id:    String(e.category?.id || ""),
      amount:         String(e.amount),
      date:           e.date.slice(0, 10),
      description:    e.description || "",
      supplier:       e.supplier || "",
      payment_method: e.payment_method || "",
      period:         e.period || "one-time",
      status:         e.status,
      invoice_no:     e.invoice_no ?? "",
    });
    setAmountDisplay(Number(e.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.date)   { setError("Tarih zorunludur"); return; }
    if (!form.amount) { setError("Tutar zorunludur"); return; }
    const url    = editExpense ? `/api/expenses/${editExpense.id}` : "/api/expenses";
    const method = editExpense ? "PUT" : "POST";
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
    const data = await res.json();
    if (!data.success) { setError(data.error); return; }
    setShowModal(false);
    load();
  };

  const handleSaveCategory = async () => {
    if (!catForm.name) { setError("Kategori adı zorunlu"); return; }
    if (editCategory) {
      askConfirm(`"${catForm.name}" kategorisini güncellemek istediğinizden emin misiniz?`, async () => {
        const res  = await fetch(`/api/expenses/categories/${editCategory.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        setShowConfirm(false); setShowCatModal(false); load();
      });
      return;
    }
    const res  = await fetch("/api/expenses/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
    const data = await res.json();
    if (!data.success) { setError(data.error); return; }
    setShowCatModal(false); setCatForm({ name: "", icon: "" }); load();
  };

  const handleDeleteCategory = (id: number) => {
    askConfirm("Bu kategoriyi silmek istediğinizden emin misiniz?", async () => {
      const res  = await fetch(`/api/expenses/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { alert(data.error); return; }
      setShowConfirm(false); load();
    });
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("file", importFile);
    const res  = await fetch("/api/expenses/import", { method: "POST", body: formData });
    const data = await res.json();
    setImportResult(data.results);
    setImporting(false);
    if (data.success) load();
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <Breadcrumb items={[{ label: "Dashboard", url: "/dashboard" }, { label: "Giderler" }]} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Giderler</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ padding: "7px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ padding: "7px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <button onClick={() => { setImportResult(null); setImportFile(null); setShowImportModal(true); }} style={{ padding: "8px 14px", background: "white", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            📥 Ekstre Yükle
          </button>
          <button onClick={() => { setEditCategory(null); setCatForm({ name: "", icon: "" }); setError(""); setShowCatModal(true); }} style={{ padding: "8px 14px", background: "white", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            + Kategori Ekle
          </button>
          <button onClick={openAdd} style={{ padding: "8px 16px", background: "#534AB7", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            + Yeni Gider
          </button>
        </div>
      </div>

      {/* Kategoriler */}
      <div style={{ background: "white", borderRadius: 8, border: "1px solid #eee", marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Kategoriler</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 16 }}>
          {categories.map(cat => (
            <CategoryBadge key={cat.id} cat={cat}
              onEdit={() => { setEditCategory(cat); setCatForm({ name: cat.name, icon: cat.icon || "" }); setError(""); setShowCatModal(true); }}
              onDelete={() => handleDeleteCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Tablo */}
      {loading ? (
        <p style={{ color: "#888", fontSize: 14 }}>Yükleniyor...</p>
      ) : sortedMonths.length === 0 ? (
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #eee", padding: 32, textAlign: "center", color: "#aaa", fontSize: 14 }}>
          Bu dönemde gider bulunamadı
        </div>
      ) : sortedMonths.map(month => {
        const monthExpenses = grouped[month];
        const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        return (
          <div key={month} style={{ background: "white", borderRadius: 8, border: "1px solid #eee", overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "12px 16px", background: "#f9f9f9", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>{months[month]} {selectedYear}</span>
              <span style={{ fontSize: 13, color: "#534AB7", fontWeight: 600 }}>Toplam: {total.toLocaleString("tr-TR")} ₺</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <th style={th}>Fatura No</th><th style={th}>Kategori</th><th style={th}>Tutar</th>
                  <th style={th}>Tarih</th><th style={th}>Tedarikçi</th><th style={th}>Dönem</th>
                  <th style={th}>Durum</th><th style={th}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.map((exp, index) => {
                  const s = statusLabel[exp.status] || statusLabel.PENDING;
                  return (
                    <tr key={exp.id} style={{ borderBottom: "1px solid #f0f0f0", background: index % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={td}>{exp.invoice_no || <span style={{ color: "#ccc" }}>—</span>}</td>
                      <td style={td}>{exp.category?.name || <span style={{ color: "#ccc" }}>—</span>}</td>
                      <td style={td}><strong>{Number(exp.amount).toLocaleString("tr-TR")} ₺</strong></td>
                      <td style={td}>{new Date(exp.date).toLocaleDateString("tr-TR")}</td>
                      <td style={td}>{exp.supplier || <span style={{ color: "#ccc" }}>—</span>}</td>
                      <td style={td}>{exp.period || <span style={{ color: "#ccc" }}>—</span>}</td>
                      <td style={td}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={td}><button onClick={() => openEdit(exp)} style={actionBtn}>Düzenle</button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f9f9f9", borderTop: "1px solid #eee" }}>
                  <td colSpan={2} style={{ padding: "10px 16px", fontSize: 13, color: "#555", fontWeight: 600 }}>{monthExpenses.length} gider</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#534AB7" }}>{total.toLocaleString("tr-TR")} ₺</td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}

      {/* ── Gider Modal ── */}
      {showModal && (
        <Modal
          title={editExpense ? "Gider Düzenle" : "Yeni Gider"}
          onClose={() => setShowModal(false)}
          onConfirm={handleSave}
          error={error}
        >
          <Field label="Kategori">
            <select
              value={form.category_id}
              onChange={e => {
                const id  = e.target.value;
                const cat = categories.find(c => String(c.id) === id);
                const name = cat?.name?.toLowerCase() || "";
                const autoSupplier = Object.entries(supplierMap).find(([k]) => name.includes(k))?.[1] || form.supplier;
                setForm({ ...form, category_id: id, supplier: autoSupplier });
              }}
              style={inputStyle}
            >
              <option value="">Seçin...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Fatura No">
            <input type="text" value={form.invoice_no} onChange={e => setForm({ ...form, invoice_no: e.target.value })} style={inputStyle} />
          </Field>

          <Field label="Tutar (₺)">
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={amountDisplay}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9,]/g, "");
                  setAmountDisplay(raw);
                  const asNumber = raw.replace(",", ".");
                  if (!isNaN(Number(asNumber))) setForm({ ...form, amount: asNumber });
                }}
                onBlur={() => {
                  const num = Number(form.amount);
                  if (!isNaN(num) && form.amount !== "")
                    setAmountDisplay(num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                }}
                onFocus={() => setAmountDisplay(form.amount)}
                style={{ ...inputStyle, paddingRight: 36 }}
              />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#888", pointerEvents: "none" }}>₺</span>
            </div>
          </Field>

          <Field label="Tarih">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Açıklama">
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Tedarikçi">
            <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Ödeme Yöntemi">
            <input type="text" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} style={inputStyle} />
          </Field>

          <Field label="Dönem">
            <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} style={inputStyle}>
              <option value="Tek Seferlik">Tek Seferlik</option>
              <option value="Aylık">Aylık</option>
              <option value="Yıllık">Yıllık</option>
            </select>
          </Field>

          <Field label="Durum">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
              <option value="PENDING">Bekliyor</option>
              <option value="PAID">Ödendi</option>
              <option value="CANCELLED">İptal</option>
            </select>
          </Field>
        </Modal>
      )}

      {/* ── Kategori Modal ── */}
      {showCatModal && (
        <Modal
          title={editCategory ? "Kategori Düzenle" : "Yeni Kategori"}
          onClose={() => setShowCatModal(false)}
          onConfirm={handleSaveCategory}
          width={380}
          error={error}
        >
          <Field label="Kategori Adı">
            <input type="text" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="İkon (opsiyonel)">
            <input type="text" value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })} style={inputStyle} />
          </Field>
        </Modal>
      )}

      {/* ── Onay Modal ── */}
      {showConfirm && (
        <Modal
          title="Onay Gerekiyor"
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmAction}
          confirmLabel="Evet, Devam Et"
          confirmDanger
          width={380}
        >
          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>{confirmMessage}</p>
        </Modal>
      )}

      {/* ── İmport Modal ── */}
      {showImportModal && (
        <Modal
          title="Ziraat Bankası Ekstre Yükle"
          onClose={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}
          width={560}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}
                style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "white", color: "#555" }}>
                Kapat
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importFile}
                style={{ padding: "8px 16px", fontSize: 13, border: "none", borderRadius: 6, cursor: importing || !importFile ? "not-allowed" : "pointer", color: "white", background: importing || !importFile ? "#94a3b8" : "#534AB7" }}
              >
                {importing ? "Yükleniyor..." : "İçe Aktar"}
              </button>
            </div>
          }
        >
          <p style={{ fontSize: 12, color: "#888", marginBottom: 16, marginTop: 0 }}>
            Ziraat'ten indirdiğin Excel (.xlsx) dosyasını seç. Beklenen format: <code>Tarih | Açıklama | Tutar | Bakiye</code>
          </p>
          <div
            onClick={() => document.getElementById("excelInput")?.click()}
            style={{ border: "2px dashed #ddd", borderRadius: 8, padding: 32, textAlign: "center", cursor: "pointer", marginBottom: 16, background: importFile ? "#f0fdf4" : "white" }}
          >
            {importFile ? (
              <>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                <p style={{ fontSize: 13, color: "#16a34a", fontWeight: 500, margin: "0 0 4px" }}>{importFile.name}</p>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{(importFile.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📥</div>
                <p style={{ fontSize: 13, color: "#555", margin: "0 0 4px" }}>Excel dosyasını buraya sürükle veya tıkla</p>
                <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>.xlsx, .xls desteklenir</p>
              </>
            )}
            <input id="excelInput" type="file" accept=".xlsx,.xls" style={{ display: "none" }}
              onChange={e => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }} />
          </div>

          {importResult && (
            <div style={{ padding: 12, background: "#f9f9f9", borderRadius: 6, fontSize: 13 }}>
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
        </Modal>
      )}
    </div>
  );
}
