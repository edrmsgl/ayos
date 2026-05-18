import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  url?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888", marginBottom: 20 }}>
      {items.map((item, index) => (
        <span key={index} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {index > 0 && <span style={{ color: "#ccc" }}>/</span>}
          {item.url ? (
            <Link href={item.url} style={{ color: "#534AB7", textDecoration: "none" }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "#333" }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}