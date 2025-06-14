"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { categoryColors } from "@/data/categories";
import { format, set } from "date-fns";
import { ChevronDown, ChevronUp, Clock, MoreHorizontal, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTransactions } from "@/actions/account";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
// import { date } from "zod"

const RECURRING_INTERVALS = {
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    YEARLY: "Yearly",
    DAILY: "Daily",
    BIWEEKLY: "Biweekly",
};

const TransactionTable = ({ transactions }) => {

    const router = useRouter();

    const [seletedIds, setseletedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        field: "date",
        direction: "desc",
    });
    
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [recurringFilter, setRecurringFilter] = useState("");

    const {loading: deleteLoading,
        fn: deleteFn,
        data: deleted,
    } =  useFetch(bulkDeleteTransactions);

    const handleBulkDelete = async () => {
        if(!window.confirm(`Are you sure you want to delete ${seletedIds.length} transactions?`))
            return;
        
        deleteFn(seletedIds);
    }
    
    useEffect(() => {
        if(deleted && !deleteLoading){
            toast.error("Transactions Deleted Successfully");
        }
    }, [deleted, deleteLoading])

    const filteredAndSortedTransactions = useMemo(() => {
        let res = [...transactions];
        //Search Filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            res = res.filter((transaction) =>
                transaction.description?.toLowerCase().includes(searchLower)
            );
        }
        //Recurring Filter
        if (recurringFilter) {
            res = res.filter((transaction) => {
                if (recurringFilter === "recurring") return transaction.isRecurring;
                return !transaction.isRecurring
        }); }
        //Type Filter
        if (typeFilter) {
            res = res.filter((transaction) => transaction.type === typeFilter);
        }

        //Sorting
        res.sort((a, b) => {
            let comp = 0;
            switch (sortConfig.field) {
                case "date":
                    comp = new Date(a.date) - new Date(b.date);
                    break;
                case "amount":
                    comp = a.amount - b.amount;
                    break;
                case "category":
                    comp = a.category.localeCompare(b.category);
                    break;
                default:
                    comp=0;
            }
            return sortConfig.direction === "asc" ? comp : -comp;
        })
        return res;
    }, [
        transactions,
        searchTerm,
        typeFilter,
        recurringFilter,
        sortConfig,
    ]);

    const handleSort = (field) => {
        setSortConfig((cur) => ({
            field,
            direction: cur.field == field && cur.direction === "asc" ? "desc" : "asc"
        }))
    }

    const handleSelect = (e) => {
        setseletedIds((cur=>
            cur.includes(e)?cur.filter(item=>item!=e):
            [...cur, e]));
    }

    const handleSelectAll = () => {
        setseletedIds((cur=>
            cur.length === filteredAndSortedTransactions.length ? []:
            filteredAndSortedTransactions.map(e=>e.id)));
    }


    const handelClearFilters = () => {
        setSearchTerm("");
        setTypeFilter("");
        setRecurringFilter("");
        setseletedIds([]);
    }    
    
    return (
        <div className="space-y-4">
            {deleteLoading &&  (<BarLoader className="mt-4" width={"100%"} color="#9333ea"/>)}
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input className="pl-7"
                    placeholder="Search Transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
  <SelectTrigger>
    <SelectValue placeholder="All Types"/>
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="INCOME">Income</SelectItem>
    <SelectItem value="EXPENSE">Expense</SelectItem>
  </SelectContent>
</Select>

<Select value={recurringFilter} onValueChange={(value)=>setRecurringFilter(value) }>
  <SelectTrigger className="w-[150px]">
    <SelectValue placeholder="All Transaction"/>
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="recurring">Recurring Only</SelectItem>
    <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
  </SelectContent>
</Select>

{seletedIds.length > 0 &&( <div className="flex items-center gap-2">
    <Button variant="destructive" size="sm" className="h-8"
    onClick={handleBulkDelete} >
        <Trash2 /> Delete ({seletedIds.length})</Button>
        </div>)}
        
        {(searchTerm || typeFilter || recurringFilter) && 
        <Button className="cursor-pointer border-violet-300 rounded-2xl"
        variant="outline" size="icon" onClick={handelClearFilters} title="Clear Filters">
            <X className="h-4 w-4" />
            </Button>}
                </div>
            </div>


            {/* Transcations */}
            <div className="rouded-md border">
                <Table>
                    <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader className="bg-violet-200">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox className="border-black"
                                onCheckedChange={handleSelectAll}
                                checked={seletedIds.length === 
                                    filteredAndSortedTransactions.length && filteredAndSortedTransactions.length > 0
                                } />
                            </TableHead>

                            <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                                <div className="flex items-center">Date {sortConfig.field==='date' && (
                                    sortConfig.direction === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> :
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}</div>
                            </TableHead>

                            <TableHead>Description</TableHead>

                            <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                                <div className="flex items-center">Category {sortConfig.field==='category' && (
                                    sortConfig.direction === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> :
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}</div>
                            </TableHead>

                            <TableHead className="text-right cursor-pointer" onClick={() => handleSort("amount")}>
                                <div className="flex items-center justify-end">Amount {sortConfig.field==='amount' && (
                                    sortConfig.direction === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> :
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}</div>
                            </TableHead>

                            <TableHead>Recurring</TableHead>
                            <TableHead className="w-[50px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedTransactions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-red-500">
                                    No transactions found❗
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedTransactions?.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        <Checkbox className="border-violet-400" 
                                        onCheckedChange={() => handleSelect(transaction.id)}
                                        checked={seletedIds.includes(transaction.id)} />
                                    </TableCell>
                                    <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className="capitalize">
                                        <span style={{ background: categoryColors[transaction.category] }}
                                            className="rounded-md px-2 py-1 text-xs text-white font-medium">
                                            {transaction.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium" style={{ color: transaction.type == "EXPENSE" ? "red" : "green" }}>
                                        {transaction.type == "EXPENSE" ? "-" : "+"}$
                                        {transaction.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>{transaction.isRecurring ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge variant="outline" className="gap-1 bg-violet-100 text-violet-700 hover:bg-purple-300">
                                                        <RefreshCw className="h-3 w-3" />
                                                        {RECURRING_INTERVALS[transaction.recurringInterval]}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="text-sm">
                                                        <div className="font-medium">Next Date:</div>
                                                        <div>{format(new Date(transaction.nextRecurringDate), "PP")}</div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : <Badge variant="outline" className="gap-1">
                                        <Clock className="h-3 w-3" />
                                        One-time</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/transaction/create?edit=${transaction.id}`)}
                                                >Edit</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive cursor-pointer" 
                                                onClick={() => deleteFn([transaction.id])}
                                                >Delete</DropdownMenuItem>
                                                
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default TransactionTable