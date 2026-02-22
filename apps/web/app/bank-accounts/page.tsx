import Link from 'next/link';
import { prisma } from '@acme/db';
export default async function Accounts(){ const list = await prisma.bankAccount.findMany(); return <div><h1>Bank Accounts</h1><table><tbody>{list.map(a=><tr key={a.id}><td><Link href={`/bank-accounts/${a.id}/transactions`}>{a.bankName}</Link></td><td>{a.accountNumber}</td><td><form method='post' action={`/api/bank-accounts/${a.id}/sync`}><button>Sync</button></form></td></tr>)}</tbody></table></div>; }
