import React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staffMembers } from "@/data/mock-data";

const roleStyles: Record<string, { badge: string; label: string }> = {
  server: { badge: "bg-status-blue-light text-primary", label: "Server" },
  cashier: { badge: "bg-status-amber-light text-status-amber", label: "Cashier" },
  manager: { badge: "bg-primary text-primary-foreground", label: "Manager" },
  kitchen: { badge: "bg-status-green-light text-status-green", label: "Kitchen" },
};

const AdminStaff: React.FC = () => (
  <div className="p-4 sm:p-7">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Staff & Permissions</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{staffMembers.length} team members</p>
      </div>
      <Button className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" />Add Staff</Button>
    </div>

    <div className="uniweb-card overflow-x-auto">
      <table className="w-full">
        <thead className="table-header">
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staffMembers.map(s => {
            const style = roleStyles[s.role] || roleStyles.server;
            return (
              <tr key={s.id} className="table-row border-b border-border last:border-0 hover:bg-accent transition-colors cursor-pointer">
                <td className="font-medium text-foreground">{s.name}</td>
                <td>
                  <span className={`status-badge ${style.badge}`}>{style.label}</span>
                </td>
                <td className="text-muted-foreground text-[13px]">
                  {s.role === "manager" ? "Full access" : s.role === "cashier" ? "POS, refunds" : s.role === "kitchen" ? "KDS only" : "POS, tables"}
                </td>
                <td>
                  <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminStaff;
