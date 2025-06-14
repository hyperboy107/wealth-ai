"use client";
import { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Pencil, X } from 'lucide-react';
import useFetch from '@/hooks/use-fetch';
import { updateBudget } from '@/actions/budget';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const BudgetProgress = ({ initialBudget, currentExpenses }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newBudget, setNewBudget] = useState(initialBudget?.amount?.toString() || "");

    const percentageUsed = initialBudget ? (
        currentExpenses / initialBudget.amount
    ) * 100 : 0;

    const {
        loading: isLoading,
        fn: updateBudgetFn,
        data: updateBudgetData,
        error,
    } = useFetch(updateBudget);

    const handleUpdateBudget = async () => {
        const amount = parseFloat(newBudget);
        if(isNaN(amount) || amount <= 0){
            toast.error("Please enter a valid budget amount");
            return;
        }
        await updateBudgetFn(amount);
     };

     useEffect(() => {
        if (updateBudgetData) {
            setIsEditing(false);
            toast.success("Budget updated successfully");
        }
        if (error) {
            toast.error("Error updating budget");
        }
    }, [updateBudgetData, error]);

    const handleCancel = () => {
        setNewBudget(initialBudget?.amount?.toString() || "");
        setIsEditing(false);
    }
    return (
        <div>
            <Card>
                <CardHeader className="flex items-center justify-between flex-row space-y-0 pb-2">
                    <div className='flex-1'>
                        <CardTitle>Monthly Budget (Default Account)</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            {isEditing ? <div className='flex items-center gap-2'>
                                <Input
                                    type="number" value={newBudget}
                                    onChange={(e) => setNewBudget(e.target.value)}
                                    className='w-32' placeholder="Enter Amount" autoFocus />
                                <Button variant="ghost" size="icon" onClick={handleUpdateBudget} disabled={isLoading}>
                                    <Check className='h-4 w-4 text-green-500' />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isLoading}>
                                    <X className='h-4 w-4 text-rose-500' />
                                </Button>
                            </div> : <>
                                <CardDescription>
                                    {initialBudget ? `$${currentExpenses.toFixed(2)} of
                $${initialBudget.amount.toFixed(2)} spent` : "No Budget Set"}
                                </CardDescription>
                                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-6 w-6 cursor-pointer">
                                    <Pencil className='h-4 w-4 text-indigo-500' disabled={isLoading}/>
                                </Button>
                            </>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {initialBudget && (<div className='space-y-2'>
                        <Progress value={percentageUsed}
                        extraStyles={`${
                            percentageUsed >= 90 ? "bg-red-500" :
                            percentageUsed >= 75 ? "bg-orange-500" : "bg-green-500"
                        }
                        }`}/>
                        <p className='text-xs text-muted-foreground text-right'>
                            {percentageUsed.toFixed(1)}% used
                        </p>
                        </div>)}
                </CardContent>
            </Card>
        </div>
    )
}

export default BudgetProgress