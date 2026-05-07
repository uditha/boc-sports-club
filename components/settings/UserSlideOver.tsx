"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUser, updateUser, type UserRow } from "@/app/actions/users";
import type { SportRow } from "@/app/actions/sports";

const ROLES = ["super_admin", "sport_admin", "viewer"] as const;

const ROLE_INFO: Record<typeof ROLES[number], { label: string; desc: string }> = {
  super_admin: { label: "Super Admin", desc: "Full access — approves results and manages all users" },
  sport_admin: { label: "Sport Admin", desc: "Manages assigned sport(s) and submits results for approval" },
  viewer: { label: "Viewer", desc: "Read-only access to rankings and reports" },
};

const SL_PROVINCES = [
  "Central", "Eastern", "North Central", "North Western",
  "Northern", "Sabaragamuwa", "Southern", "Uva", "Western",
];

const createSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  fullName: z.string().min(1, "Full name required"),
  role: z.enum(ROLES),
  province: z.string().optional(),
  password: z.string().min(8, "Minimum 8 characters"),
  assignedSportIds: z.array(z.string()).optional(),
});

const editSchema = z.object({
  fullName: z.string().min(1, "Full name required"),
  role: z.enum(ROLES),
  province: z.string().optional().nullable(),
  active: z.boolean(),
  password: z.string().min(8, "Minimum 8 characters").or(z.literal("")).optional(),
  assignedSportIds: z.array(z.string()).optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

type Props =
  | { mode: "create"; trigger: React.ReactNode; sports?: SportRow[] }
  | { mode: "edit"; trigger: React.ReactNode; user: UserRow; sports?: SportRow[] };

export default function UserSlideOver(props: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const user = isEdit ? props.user : null;
  const sports = props.sports ?? [];

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", fullName: "", role: "viewer", province: "", password: "", assignedSportIds: [] },
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      role: (user?.role as typeof ROLES[number]) ?? "viewer",
      province: user?.province ?? "",
      active: Boolean(user?.active),
      password: "",
      assignedSportIds: user?.assignedSportIds ?? [],
    },
  });

  function handleOpen() {
    if (isEdit && user) {
      editForm.reset({
        fullName: user.fullName,
        role: user.role as typeof ROLES[number],
        province: user.province ?? "",
        active: Boolean(user.active),
        password: "",
        assignedSportIds: user.assignedSportIds ?? [],
      });
    }
    setOpen(true);
  }

  async function onCreateSubmit(data: CreateForm) {
    const result = await createUser(data);
    if (result.error) { toast.error(result.error); return; }
    toast.success("User created");
    setOpen(false);
    createForm.reset();
    router.refresh();
  }

  async function onEditSubmit(data: EditForm) {
    if (!user) return;
    const result = await updateUser(user.id, data);
    if (result.error) { toast.error(result.error); return; }
    toast.success("User updated");
    setOpen(false);
    router.refresh();
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand";
  const errorCls = "text-xs text-red-500 mt-1";

  function SportMultiSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
    function toggle(id: string) {
      onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
    }
    return (
      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {sports.length === 0 ? (
          <p className="text-xs text-text-grey italic">No sports configured yet</p>
        ) : (
          sports.filter(s => Boolean(s.active)).map(s => (
            <label key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg border border-purple-100 hover:border-brand/40 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-bg/40 transition-colors">
              <input
                type="checkbox"
                checked={value.includes(s.id)}
                onChange={() => toggle(s.id)}
                className="accent-brand"
              />
              <span className="text-sm text-text-dark">{s.name}</span>
            </label>
          ))
        )}
      </div>
    );
  }

  const createRole = createForm.watch("role");
  const editRole = editForm.watch("role");

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer">{props.trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100">
              <h2 className="text-lg font-bold text-text-dark">{isEdit ? "Edit User" : "Add User"}</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-grey hover:bg-brand-bg hover:text-brand transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Create form */}
            {!isEdit && (
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">Username</label>
                    <input {...createForm.register("username")} placeholder="e.g. john_doe" className={inputCls} />
                    {createForm.formState.errors.username && <p className={errorCls}>{createForm.formState.errors.username.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">Full Name</label>
                    <input {...createForm.register("fullName")} placeholder="e.g. John Doe" className={inputCls} />
                    {createForm.formState.errors.fullName && <p className={errorCls}>{createForm.formState.errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">Province</label>
                    <select {...createForm.register("province")} className={inputCls}>
                      <option value="">— Not specified —</option>
                      {SL_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">Role</label>
                    <div className="space-y-2">
                      {ROLES.map((role) => (
                        <label key={role} className="flex items-start gap-3 p-3 rounded-xl border border-purple-100 hover:border-brand/40 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-bg/50 transition-colors">
                          <input type="radio" value={role} {...createForm.register("role")} className="mt-0.5 accent-brand" />
                          <div>
                            <p className="text-sm font-medium text-text-dark">{ROLE_INFO[role].label}</p>
                            <p className="text-xs text-text-grey">{ROLE_INFO[role].desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {createRole === "sport_admin" && (
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1.5">Assigned Sports</label>
                      <SportMultiSelect
                        value={createForm.watch("assignedSportIds") ?? []}
                        onChange={v => createForm.setValue("assignedSportIds", v)}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">Password</label>
                    <input {...createForm.register("password")} type="password" placeholder="Minimum 8 characters" className={inputCls} />
                    {createForm.formState.errors.password && <p className={errorCls}>{createForm.formState.errors.password.message}</p>}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-purple-100 flex gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200 text-sm font-medium text-text-grey hover:bg-brand-bg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={createForm.formState.isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors disabled:opacity-60">
                    {createForm.formState.isSubmitting ? "Creating…" : "Create User"}
                  </button>
                </div>
              </form>
            )}

            {/* Edit form */}
            {isEdit && (
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">Full Name</label>
                    <input {...editForm.register("fullName")} placeholder="e.g. John Doe" className={inputCls} />
                    {editForm.formState.errors.fullName && <p className={errorCls}>{editForm.formState.errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">Province</label>
                    <select {...editForm.register("province")} className={inputCls}>
                      <option value="">— Not specified —</option>
                      {SL_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">Role</label>
                    <div className="space-y-2">
                      {ROLES.map((role) => (
                        <label key={role} className="flex items-start gap-3 p-3 rounded-xl border border-purple-100 hover:border-brand/40 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-bg/50 transition-colors">
                          <input type="radio" value={role} {...editForm.register("role")} className="mt-0.5 accent-brand" />
                          <div>
                            <p className="text-sm font-medium text-text-dark">{ROLE_INFO[role].label}</p>
                            <p className="text-xs text-text-grey">{ROLE_INFO[role].desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {editRole === "sport_admin" && (
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1.5">Assigned Sports</label>
                      <SportMultiSelect
                        value={editForm.watch("assignedSportIds") ?? []}
                        onChange={v => editForm.setValue("assignedSportIds", v)}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/50 border border-purple-100">
                    <div>
                      <p className="text-sm font-medium text-text-dark">Active</p>
                      <p className="text-xs text-text-grey">Inactive users cannot log in</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" {...editForm.register("active")} />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand peer-focus:ring-2 peer-focus:ring-brand/30 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1.5">New Password <span className="text-text-grey font-normal">(leave blank to keep current)</span></label>
                    <input {...editForm.register("password")} type="password" placeholder="Leave blank to keep current" className={inputCls} />
                    {editForm.formState.errors.password && <p className={errorCls}>{editForm.formState.errors.password.message}</p>}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-purple-100 flex gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200 text-sm font-medium text-text-grey hover:bg-brand-bg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={editForm.formState.isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors disabled:opacity-60">
                    {editForm.formState.isSubmitting ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
