import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="flex items-center justify-between border-b bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-xl font-bold">Feedback Portal Dashboard</h1>
        <div className="flex items-center gap-4">
          <OrganizationSwitcher afterCreateOrganizationUrl="/dashboard" />
          <UserButton />
        </div>
      </header>

      <main className="mt-8">
        <p className="text-gray-600">
          Select or create an organization using the switcher above to start
          managing feedback boards.
        </p>
      </main>
    </div>
  );
}
