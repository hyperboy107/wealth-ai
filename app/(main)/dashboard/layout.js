import { Suspense } from "react"
import DashBoardPage from "./page"
import { BarLoader } from "react-spinners"

const DashBoardLayout = () => {
  return (
    <div className='px-5'> 
        <h1 className='text-5xl font-bold gradient-title mb-5'>Dashboard</h1>


        {/* DashBoard Page */}
        <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />} >
            <DashBoardPage />
        </Suspense>
        
    </div>
  )
}

export default DashBoardLayout