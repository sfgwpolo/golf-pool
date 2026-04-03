"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "../../../lib/http";

type Org = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  emblemUrl?: string | null;
  isArchived: boolean;
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
  const [orgDescription, setOrgDescription] = useState<Record<string, string>>({});
  const [orgEmblemUrl, setOrgEmblemUrl] = useState<Record<string, string>>({});
  const [orgMsg, setOrgMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const [newEmail, setNewEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newRole, setNewRole] = useState<"ORG_ADMIN" | "SUPER_ADMIN">(
    "ORG_ADMIN"
  );

  const [assignOrgId, setAssignOrgId] = useState("");
  const [assignAdminId, setAssignAdminId] = useState("");

  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [newOrgEmblemUrl, setNewOrgEmblemUrl] = useState("");

  async function createOrganization() {
    setMsg("");
    try {
      await fetchJson<{ organization: Org }>(
        "/api/admin/organizations/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newOrgName,
            slug: newOrgSlug,
            description: newOrgDescription,
            emblemUrl: newOrgEmblemUrl,
          }),
        }
      );

      setMsg("Organization created.");
      setNewOrgName("");
      setNewOrgSlug("");
      setNewOrgDescription("");
      setNewOrgEmblemUrl("");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function toggleArchiveOrg(orgId: string, isArchived: boolean) {
    setMsg("");
    try {
      await fetchJson<{ organization: Org }>(
        `/api/admin/organizations/${orgId}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isArchived }),
        }
      );

      setMsg(isArchived ? "Organization archived." : "Organization restored.");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

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
        }
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
      const data = await fetchJson<CreateAdminResponse>(
        "/api/admin/admin-users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newEmail,
            password: newPw,
            role: newRole,
          }),
        }
      );

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
        }
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
        }
      );

      setMsg("Removed admin from org.");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-2xl font-bold">Organizations & Admins</h1>

      <div className="mt-2.5 flex gap-2.5 items-center flex-wrap">
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        {msg && (
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {msg}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="font-bold">Create organization</div>

        <input
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          placeholder="Organization name"
          className="w-full p-2 mt-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <input
          value={newOrgSlug}
          onChange={(e) => setNewOrgSlug(e.target.value)}
          placeholder="Slug (e.g. joyce-demo)"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <input
          value={newOrgEmblemUrl}
          onChange={(e) => setNewOrgEmblemUrl(e.target.value)}
          placeholder="Emblem URL"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <textarea
          value={newOrgDescription}
          onChange={(e) => setNewOrgDescription(e.target.value)}
          placeholder="Organization description"
          rows={3}
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <button
          onClick={createOrganization}
          disabled={!newOrgName.trim() || !newOrgSlug.trim()}
          className="mt-2 px-3 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Create organization
        </button>
      </div>

      <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="font-bold">Create admin user</div>
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 mt-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />
        <input
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="Password (min 8 chars)"
          type="password"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />
        <select
          value={newRole}
          onChange={(e) =>
            setNewRole(e.target.value as "ORG_ADMIN" | "SUPER_ADMIN")
          }
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        >
          <option value="ORG_ADMIN">ORG_ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <button
          onClick={createAdmin}
          disabled={!newEmail.trim() || newPw.length < 8}
          className="mt-2 px-3 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Create admin
        </button>
      </div>

      <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="font-bold">Assign admin to organization</div>

        <select
          value={assignOrgId}
          onChange={(e) => setAssignOrgId(e.target.value)}
          className="w-full p-2 mt-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
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
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
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
          className="mt-2 px-3 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Assign
        </button>

        <div className="mt-2.5 text-xs opacity-80">
          Select an admin user and assign them to an organization.
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {orgs.map((o) => (
          <div
            key={o.id}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div className="text-lg font-bold">
              {o.name}{" "}
              <span className="opacity-60 text-xs">({o.slug})</span>
            </div>

            <label className="flex gap-2 items-center mt-2.5">
              <input
                type="checkbox"
                checked={Boolean(o.isArchived)}
                onChange={(e) => toggleArchiveOrg(o.id, e.target.checked)}
              />
              <span>Archive organization</span>
            </label>

            <div className="mt-2 font-bold">Admins</div>
            {o.admins.length === 0 ? (
              <div className="opacity-70 text-sm">None assigned.</div>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {o.admins.map((a) => (
                  <li key={a.id} className="text-sm flex items-center justify-between">
                    <span>
                      {a.email} <span className="opacity-70">({a.role})</span>
                    </span>
                    <button
                      onClick={() => unassign(o.id, a.id)}
                      className="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2.5 pt-2.5 border-t border-gray-300 dark:border-gray-600">
              <div className="font-bold">Public landing page details</div>

              <input
                value={orgEmblemUrl[o.id] ?? ""}
                onChange={(e) =>
                  setOrgEmblemUrl((prev) => ({
                    ...prev,
                    [o.id]: e.target.value,
                  }))
                }
                placeholder="Emblem URL"
                className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
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
                className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
              />

              <button
                onClick={() => saveOrgDetails(o.id)}
                className="mt-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded font-semibold"
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