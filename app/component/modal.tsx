"use client";

import React from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDanger?: boolean;
  width?: number;
  children: React.ReactNode;
  error?: string;
  footer?: React.ReactNode;
}

export function Modal({
  title,
  onClose,
  onConfirm,
  confirmLabel = "Kaydet",
  confirmDanger = false,
  width = 460,
  children,
  error,
  footer,
}: ModalProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }} // backdrop click
    >
      <div
        style={{
          background: "white", borderRadius: 10, padding: 28, width,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#aaa", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* İçerik */}
        {children}

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8, marginBottom: 0 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          {footer ?? (
            <>
              <button
                onClick={onClose}
                style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "white", color: "#555" }}
              >
                İptal
              </button>
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  style={{
                    padding: "8px 16px", fontSize: 13, border: "none", borderRadius: 6,
                    cursor: "pointer", color: "white",
                    background: confirmDanger ? "#dc2626" : "#534AB7",
                  }}
                >
                  {confirmLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
