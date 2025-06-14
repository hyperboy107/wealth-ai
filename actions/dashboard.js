"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


const serializeTransaction = (obj) => {
    const serialized = { ...obj };

    if(obj.balance){
        serialized.balance = obj.balance.toNumber();
    }
    if(obj.amount){
        serialized.amount = obj.amount.toNumber();
    }

    return serialized;
}

export async function createAccount(data) {
    try {
        const {userId} = await auth();
        if(!userId){
            throw new Error("User not authenticated");
        }

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user){
            throw new Error("User not found");
        }

        //Covert balance to float befrore saving
        const balanceFloat = parseFloat(data.balance);
        if(isNaN(balanceFloat)) {
            throw new Error("Invalid balance amount");
        }

        //Check if account is already created
        const existingAccount = await db.account.findMany({
            where: {
                userId: user.id,
            },
        });

        const shouldBeDefault = existingAccount.length === 0?true:data.isDefault;
        //If the account should be default, unset other deafault accounts
        if(shouldBeDefault){
            await db.account.updateMany({
                where: {
                    userId: user.id,
                },
                data: {
                    isDefault: false,
                },
            });
        }
        //Create the account
        const account = await db.account.create({
            data: {
                ...data,
                userId: user.id,
                balance: balanceFloat,
                isDefault: shouldBeDefault,
            },
        });
        const serializedAccount = serializeTransaction(account);
        revalidatePath("/dashboard");
        return { success: true, data: serializedAccount };
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function getUserAccounts() {
    const {userId} = await auth();
        if(!userId){
            throw new Error("User not authenticated");
        }

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user){
            throw new Error("User not found");
        }

        const accounts = await db.account.findMany({
            where:{ userId: user.id },
            orderBy:{ createdAt: "desc" },
            include: {
                _count:{
                    select:{
                        transactions: true,
                    }
                }
            }
        });
        const serializedAccount = accounts.map(serializeTransaction);
        return serializedAccount;
}


export async function getDashboardData(){
    const {userId} = await auth();
        if(!userId){
            throw new Error("User not authenticated");
        }

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if(!user){
            throw new Error("User not found");
        }

        //Get all user transactions
        const transactions = await db.transaction.findMany({
            where: {userId: user.id},
            orderBy: {createdAt: "desc"},
        })

        return transactions.map(serializeTransaction);
}