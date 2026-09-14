import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getAdminDashboardData } from '@/lib/admin/queries'
import { AdminPanel } from '@/components/estacionando/admin-panel'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.isAdmin) redirect('/')

  const data = await getAdminDashboardData()

  return <AdminPanel user={user} data={data} />
}
