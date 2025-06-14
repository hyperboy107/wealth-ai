"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import Image from "next/image"
import { useRef, useEffect } from "react"

const Hero = () => {
    const imageRef = useRef();

    useEffect(() => {
        const imageElement = imageRef.current;

        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const scrollThreshold = 100;

            if (scrollPosition > scrollThreshold) {
                imageElement.classList.add("scrolled");
            } else {
                imageElement.classList.remove("scrolled");
            }
        }

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll)
    }, []) 
  return (
    <div className="pb-20 px-4">
        <div className="container mx-auto text-center">
            <h1 className="gradient-title text-5xl md:text-8xl lg:text-[105px] pb-6">Manage Your Finances <br/> With Intelligence</h1>
            <p className="text-xl to-gray-600 mb-8 max-w-2xl mx-auto">An <span className="text-purple-500">AI</span>-powered financial management platform that helps you track, analyze, and optimize your spending with real-time insights</p>
            <div className="flex justify-center space-x-4">
                <Link href="/dashboard">
                    <Button size="lg" className="px-8 border-purple rounded-2xl">Get Started</Button>
                </Link>
                <Link href="">
                    <Button size="lg" variant="outline" className="px-8 border-black rounded-2xl">watch Demo</Button>                  
                </Link>
            </div>
            <div className="hero-image-wrapper">
                <div ref={imageRef} className="hero-image">
                    <Image src="/wealth-wallpape2.avif" width={1280} height={720} alt="Dashboard Preview" priority className="rounded-lg shadow-2xl border mx-auto" />
                </div>
            </div>
        </div>
    </div>
  )
}

export default Hero