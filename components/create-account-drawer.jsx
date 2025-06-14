"use client";
import React, { useEffect } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "./ui/drawer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { accountSchema } from "@/app/lib/schema";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import useFetch from "@/hooks/use-fetch";
import { createAccount } from "@/actions/dashboard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CreateAccountDrawer = ({ children }) => {
  const [open, setOpen] = React.useState(false);

  const {register, handleSubmit, formState:{errors},setValue,watch,reset} =  useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const {data: newAccount, error, loading: createAccountloading, fn: createAccountFn} = useFetch(createAccount);

  useEffect(() => {
    if (newAccount && !createAccountloading) {
      toast.success("Account Created Succesfully");
      reset();
      setOpen(false);
    }
    }, [createAccountloading, newAccount]);

    useEffect(() => {
    if (error) {
      toast.error(error.message || "Error creating account");
    }
    }, [error]);

  const onsubmit = async(data) =>{
    await createAccountFn(data);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {/* Trigger button to open the drawer */}
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Account</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
            <form className="space-y-4" onSubmit={handleSubmit(onsubmit)}>
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Account Name</label>
                    <Input id="name" placeholder="Your Account Name"
                    {...register("name")}
                    />
                    
                    {errors.name && <p className="text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-medium">Account Type</label>
                    <Select onValueChange={(value) => setValue("type", value)} defaultValue={watch("type")}>
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Select Type"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CURRENT">Current</SelectItem>
                            <SelectItem value="SAVINGS">Savings</SelectItem>
                        </SelectContent>    
                    </Select>
                    
                    {errors.type && <p className="text-red-500">{errors.type.message}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="balance" className="text-sm font-medium">Initial Balance</label>
                    <Input id="balance" type="number" step="0.01" placeholder="0.00"
                    {...register("balance")}
                    />
                    
                    {errors.balance && <p className="text-red-500">{errors.balance.message}</p>}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                    <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer roun">Set As Default</label>
                    <p className="text-sm text-muted-foreground">This account will be selected by default for transactions</p>
                    </div>
                    <Switch id="isDefault" onCheckedChange={(checked) => setValue("isDefault", checked)} checked={watch("isDefault")}/>                   
                </div>

                <div className="flex gap-4 items-center justify-between mt-4">
                    <DrawerClose asChild>
                        <Button type="button" variant="outline" className="flex-1">Cancel</Button>
                    </DrawerClose>
                    <Button type="submit" className="flex-1" disabled={createAccountloading}>
                    {createAccountloading? ( <> 
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating... </> ) :
                    ( "Create Account" )}</Button>
                </div>
            </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateAccountDrawer;
