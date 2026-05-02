import { redirect, RedirectType } from 'next/navigation'

export default function Page() {
    redirect('/admin/payroll/dashboard', RedirectType.replace)

}