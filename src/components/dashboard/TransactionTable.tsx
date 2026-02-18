import { cn } from "@/lib/utils";
import { BiChevronRight } from "react-icons/bi";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function TransactionTable({ expenses }: { expenses: any[] }) {
    if (!expenses || expenses.length === 0) {
        return (
            <Card className="min-h-[400px]">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#29258D] rounded-full"></div>
                        <CardTitle>Recent Activity</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center opacity-50">
                    <p className="text-gray-400 font-medium text-sm">No recent transactions found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#29258D] rounded-full"></div>
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest processed transactions</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold  text-[#29258D] hover:bg-indigo-50 rounded-md px-3 flex items-center gap-2 transition-all ">
                        View All <BiChevronRight className="text-sm" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white">
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400  border-b border-gray-100">Transaction</th>
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400  border-b border-gray-100">Category</th>
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400  border-b border-gray-100">Date</th>
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400  border-b border-gray-100">Status</th>
                                <th className="text-right py-4 px-6 text-[10px] font-bold text-gray-400  border-b border-gray-100">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {expenses.map((expense: any, i: number) => (
                                <tr key={expense.id || i} className="group hover:bg-gray-50/50 transition-all duration-200 cursor-pointer">
                                    <td className="py-5 px-6">
                                        <div className="font-bold text-gray-900 group-hover:text-[#29258D] transition-colors text-sm">{expense.title}</div>
                                        <div className="text-[10px] text-gray-400 font-medium  mt-1">{expense.merchant || 'N/A'}</div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className="text-[10px] font-bold  text-gray-500 bg-gray-100 px-2 py-1 rounded-md  border border-gray-200 group-hover:bg-white transition-all">{expense.category}</span>
                                    </td>
                                    <td className="py-5 px-6 text-xs font-medium text-gray-500">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                                    <td className="py-5 px-6">
                                        <Badge
                                            className="rounded-md px-2 py-0.5 text-[9px] font-bold   shadow-none border"
                                            variant={
                                                ['APPROVED', 'PAID', 'REIMBURSED'].includes(expense.status) ? 'success' :
                                                    ['PENDING', 'PENDING_APPROVAL', 'SUBMITTED'].includes(expense.status) ? 'info' :
                                                        expense.status === 'REJECTED' ? 'destructive' : 'secondary'
                                            }
                                        >
                                            {expense.status.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <span className="font-bold text-gray-900 group-hover:text-[#29258D] transition-colors">
                                            ${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
