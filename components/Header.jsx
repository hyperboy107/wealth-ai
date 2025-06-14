import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { BadgeIndianRupee, LayoutDashboard, PenBox } from 'lucide-react'
import { checkUser } from "@/lib/checkUser";
// import { checkUser } from '@/lib/checkUser'  

const header = async () => {
  await checkUser();
  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white/70 backdrop-blur-md border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href='/'>
        <Image src={"/logo.jpg"} alt="logo" width={200} height={60} 
        className="h-12 w-auto object-contain bg-purple-500"/>
        </Link>

        <div className='flex items-center space-x-4'>
      <SignedIn>
        <Link href={'/dashboard'} className='flex items-center gap-2 text-gray-600 hover:text-indigo-600'>
          <Button variant="outline"> <LayoutDashboard size={18} />
          <span className='hidden md:inline'>DashBoard</span></Button>
        </Link>
        <Link href={'/transaction/create'} className='flex items-center gap-2'>
          <Button> <PenBox size={18} />
          <span className='hidden md:inline'>Add Transaction</span></Button>
        </Link>
      </SignedIn>

      <SignedOut>
      <SignInButton forceRedirectUrl='/dashboard'>
      <Button variant="outline">LogIn</Button>
      </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton appearance={
          {
            elements: {avatarBox: "w-10 h-10",},
          }
        }/>
      </SignedIn>
      </div>
      </nav>
    </div>
  )
}

export default header