"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "../../../lib/http";

type Org = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  emblemUrl?: string | null;
  admins: { id: string; email: string; role: string }[];
};

type AdminUser = {
  id: string;
  email: string;
  role: string;
};

type OrganizationsResponse = {
  organizations: Org[];
};

type AdminUsersResponse = {
  adminUsers: AdminUser[];
};

type SaveOrgDetailsResponse = {
  organization: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    emblemUrl: string | null;
  };
};

type CreateAdminResponse = {
  adminUser: {
    id: string;
    email: string;
    role: string;
  };
};

type SimpleOkResponse = {
  ok: true;
};

export default function OrganizationsClient() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgDescription, setOrgDescription] = useState<Record<string, string>>(
    {},
  );
  const [orgEmblemUrl, setOrgEmblemUrl] = useState<Record<string, string>>({});
  const [orgMsg, setOrgMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const [newEmail, setNewEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newRole, setNewRole] = useState<"ORG_ADMIN" | "SUPER_ADMIN">(
    "ORG_ADMIN",
  );

  const [assignOrgId, setAssignOrgId] = useState("");
  const [assignAdminId, setAssignAdminId] = useState("");

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const [orgData, adminData] = await Promise.all([
        fetchJson<OrganizationsResponse>("/api/admin/organizations", {
          cache: "no-store",
        }),
        fetchJson<AdminUsersResponse>("/api/admin/admin-users/list", {
          cache: "no-store",
        }),
      ]);

      setOrgs(orgData.organizations || []);

      const descMap: Record<string, string> = {};
      const emblemMap: Record<string, string> = {};

      for (const o of orgData.organizations || []) {
        descMap[o.id] = o.description ?? "";
        emblemMap[o.id] = o.emblemUrl ?? "";
      }

      setOrgDescription(descMap);
      setOrgEmblemUrl(emblemMap);
      setAdminUsers(adminData.adminUsers || []);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveOrgDetails(orgId: string) {
    setOrgMsg("");
    try {
      await fetchJson<SaveOrgDetailsResponse>(
        `/api/admin/organizations/${orgId}/details`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: orgDescription[orgId] ?? "",
            emblemUrl: orgEmblemUrl[orgId] ?? "",
          }),
        },
      );

      setOrgMsg("Organization details saved.");
      await load();
    } catch (e: unknown) {
      setOrgMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function createAdmin() {
    setMsg("");
    try {
      const data = await fetchJson<CreateAdminResponse>("/api/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPw,
          role: newRole,
        }),
      });

      setMsg(`Created admin: ${data.adminUser.email}`);
      setNewEmail("");
      setNewPw("");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function assignAdmin() {
    setMsg("");
    try {
      await fetchJson<SimpleOkResponse>(
        `/api/admin/organizations/${assignOrgId}/admins`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId: assignAdminId }),
        },
      );

      setMsg("Assigned admin to org.");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function unassign(orgId: string, adminId: string) {
    setMsg("");
    try {
      await fetchJson<SimpleOkResponse>(
        `/api/admin/organizations/${orgId}/admins?adminId=${adminId}`,
        {
          method: "DELETE",
        },
      );

      setMsg("Removed admin from org.");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div
      style={{ maxWidth: 900 }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Organizations & Admins</h1>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button
          onClick={load}
          disabled={loading}
          style={{ padding: "8px 12px" }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        {msg && (
          <div style={{ fontSize: 13 }}>
            <strong>{msg}</strong>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>Create admin user</div>
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
          style={{ width: "100%", padding: 8, marginTop: 10 }}
        />
        <input
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="Password (min 8 chars)"
          type="password"
          style={{ width: "100%", padding: 8, marginTop: 8 }}
        />
        <select
          value={newRole}
          onChange={(e) =>
            setNewRole(e.target.value as "ORG_ADMIN" | "SUPER_ADMIN")
          }
          style={{ width: "100%", padding: 8, marginTop: 8 }}
        >
          <option value="ORG_ADMIN">ORG_ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <button
          onClick={createAdmin}
          disabled={!newEmail.trim() || newPw.length < 8}
          style={{ marginTop: 10, padding: "8px 12px" }}
        >
          Create admin
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>
          Assign admin to organization
        </div>

        <select
          value={assignOrgId}
          onChange={(e) => setAssignOrgId(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 10 }}
        >
          <option value="">Select organization…</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.slug})
            </option>
          ))}
        </select>

        <select
          value={assignAdminId}
          onChange={(e) => setAssignAdminId(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 8 }}
        >
          <option value="">Select admin…</option>
          {adminUsers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.email} ({a.role})
            </option>
          ))}
        </select>

        <button
          onClick={assignAdmin}
          disabled={!assignOrgId || !assignAdminId}
          style={{ marginTop: 10, padding: "8px 12px" }}
        >
          Assign
        </button>

        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
          Select an admin user and assign them to an organization.
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {orgs.map((o) => (
          <div
            key={o.id}
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {o.name}{" "}
              <span style={{ opacity: 0.6, fontSize: 13 }}>({o.slug})</span>
            </div>

            <div style={{ marginTop: 8, fontWeight: 700 }}>Admins</div>
            {o.admins.length === 0 ? (
              <div style={{ opacity: 0.7, marginTop: 6 }}>None assigned.</div>
            ) : (
              <ul style={{ marginTop: 6 }}>
                {o.admins.map((a) => (
                  <li key={a.id} style={{ marginTop: 4 }}>
                    {a.email} <span style={{ opacity: 0.7 }}>({a.role})</span>{" "}
                    <button
                      onClick={() => unassign(o.id, a.id)}
                      style={{ marginLeft: 8, padding: "2px 8px" }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid #eee",
              }}
            >
              <div style={{ fontWeight: 700 }}>Public landing page details</div>

              <input
                value={orgEmblemUrl[o.id] ?? ""}
                onChange={(e) =>
                  setOrgEmblemUrl((prev) => ({
                    ...prev,
                    [o.id]: e.target.value,
                  }))
                }
                placeholder="Emblem URL"
                style={{ width: "100%", padding: 8, marginTop: 8 }}
              />

              <textarea
                value={orgDescription[o.id] ?? ""}
                onChange={(e) =>
                  setOrgDescription((prev) => ({
                    ...prev,
                    [o.id]: e.target.value,
                  }))
                }
                placeholder="Organization description"
                rows={3}
                style={{ width: "100%", padding: 8, marginTop: 8 }}
              />

              <button
                onClick={() => saveOrgDetails(o.id)}
                style={{ marginTop: 8, padding: "8px 12px" }}
              >
                Save org details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
