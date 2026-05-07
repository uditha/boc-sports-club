"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changeOwnPassword } from "@/app/actions/users";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    const result = await changeOwnPassword({ currentPassword: current, newPassword: newPass });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Password changed successfully");
    setCurrent("");
    setNewPass("");
    setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-text-dark mb-1.5">Current Password</label>
        <input
          type="password"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-dark mb-1.5">New Password</label>
        <input
          type="password"
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
          required
          minLength={8}
          placeholder="Minimum 8 characters"
          className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-dark mb-1.5">Confirm New Password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          placeholder="Re-enter new password"
          className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {loading ? "Saving…" : "Change Password"}
      </button>
    </form>
  );
}
