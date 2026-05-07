import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getUsers, type UserRow } from "@/app/actions/users";
import { getSports, getDisciplinesForSport, type SportRow, type DisciplineRow } from "@/app/actions/sports";
import { getAgeCategories, type AgeCategoryRow } from "@/app/actions/ageCategories";
import UserSlideOver from "@/components/settings/UserSlideOver";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import SportManagement from "@/components/settings/SportManagement";
import AgeCategoryManagement from "@/components/settings/AgeCategoryManagement";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-brand/10 text-brand border-brand/20",
  editor: "bg-teal-50 text-teal-700 border-teal-200",
  viewer: "bg-gray-100 text-text-grey border-gray-200",
};

export default async function SettingsPage({ searchParams }: PageProps) {
  const session = await requireUser();
  const { tab } = await searchParams;
  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin";

  const validTabs = isAdmin ? ["users", "sports", "categories", "account"] : ["account"];
  const activeTab = tab && validTabs.includes(tab) ? tab : (isAdmin ? "users" : "account");

  let userList: UserRow[] = [];
  let sportsList: SportRow[] = [];
  let disciplinesBySport: Record<string, DisciplineRow[]> = {};
  let ageCategoryList: AgeCategoryRow[] = [];

  if (isAdmin && activeTab === "users") userList = await getUsers();
  if (isAdmin && activeTab === "sports") {
    sportsList = await getSports();
    const disciplineResults = await Promise.all(
      sportsList.map((s) => getDisciplinesForSport(s.id).then((d) => [s.id, d] as const))
    );
    disciplinesBySport = Object.fromEntries(disciplineResults);
  }
  if (isAdmin && activeTab === "categories") ageCategoryList = await getAgeCategories();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Settings</h1>
        <p className="text-text-grey mt-0.5">Manage users, roles, and your account</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-brand-bg rounded-xl p-1 w-fit">
        {isAdmin && (
          <Link href="/settings?tab=users" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "users" ? "bg-white text-brand shadow-sm" : "text-text-grey hover:text-text-dark"}`}>
            User Management
          </Link>
        )}
        {isAdmin && (
          <Link href="/settings?tab=sports" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "sports" ? "bg-white text-brand shadow-sm" : "text-text-grey hover:text-text-dark"}`}>
            Sports
          </Link>
        )}
        {isAdmin && (
          <Link href="/settings?tab=categories" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "categories" ? "bg-white text-brand shadow-sm" : "text-text-grey hover:text-text-dark"}`}>
            Age Categories
          </Link>
        )}
        <Link href="/settings?tab=account" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "account" ? "bg-white text-brand shadow-sm" : "text-text-grey hover:text-text-dark"}`}>
          My Account
        </Link>
      </div>

      {/* User Management tab */}
      {activeTab === "users" && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-grey">{userList.length} user{userList.length !== 1 ? "s" : ""}</p>
            <UserSlideOver
              mode="create"
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </button>
              }
            />
          </div>

          <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-100">
                  <th className="text-left py-3 px-5 text-text-grey font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-text-grey font-medium hidden sm:table-cell">Username</th>
                  <th className="text-left py-3 px-4 text-text-grey font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-text-grey font-medium hidden md:table-cell">Status</th>
                  <th className="py-3 px-5" />
                </tr>
              </thead>
              <tbody>
                {userList.map((user) => (
                  <tr key={user.id} className="border-b border-purple-50 last:border-0 hover:bg-brand-bg/30 transition-colors">
                    <td className="py-3 px-5">
                      <p className="font-medium text-text-dark">{user.fullName}</p>
                    </td>
                    <td className="py-3 px-4 text-text-grey hidden sm:table-cell">{user.username}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${ROLE_STYLES[user.role] ?? "bg-gray-100 text-text-grey border-gray-200"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {Boolean(user.active) ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-teal-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-text-grey">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <UserSlideOver
                        mode="edit"
                        user={user}
                        trigger={
                          <button className="text-xs text-brand hover:text-brand-dark font-medium transition-colors">
                            Edit
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sports tab */}
      {activeTab === "sports" && isAdmin && (
        <div>
          <div className="mb-4">
            <h2 className="font-semibold text-text-dark">Sports Management</h2>
            <p className="text-sm text-text-grey mt-0.5">Add, rename, or deactivate sports available in player registration</p>
          </div>
          <SportManagement sportsList={sportsList} disciplinesBySport={disciplinesBySport} />
        </div>
      )}

      {/* Age Categories tab */}
      {activeTab === "categories" && isAdmin && (
        <div>
          <div className="mb-4">
            <h2 className="font-semibold text-text-dark">Age Categories</h2>
            <p className="text-sm text-text-grey mt-0.5">Manage age categories used when recording results (e.g. Open, Novices, Masters)</p>
          </div>
          <AgeCategoryManagement categories={ageCategoryList} />
        </div>
      )}

      {/* My Account tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-purple-100 p-6">
            <h2 className="font-semibold text-text-dark mb-1">Change Password</h2>
            <p className="text-sm text-text-grey mb-5">Update your login password</p>
            <ChangePasswordForm />
          </div>
        </div>
      )}
    </div>
  );
}
