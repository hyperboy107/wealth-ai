import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

const NotFound = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-[100vh] px-4 text-center'>
        <h1 className='text-6xl font-bold gradient-title mb-4 animate-pulse'>404</h1>
        <h2 className='text-3xl font-semibold mb-4'>Page Not Found</h2>
        <p className='text-lg text-gray-600 mb-8'>Sorry, the page you are looking for does not exist or has been moved.</p>
        <Link href="/">
        <Button className="animate-bounce">Return Home🏡</Button>
        </Link>
        
    </div>
  )
}

export default NotFound