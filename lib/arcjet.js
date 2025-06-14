import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
    key: process.env.ARCJET_KEY,
    characteristics: ["userId"], //Track based on clerk userId
    rules:[
        // Create a token bucket rate limit.
        tokenBucket({
            mode: "LIVE",
      refillRate: 5, // Refill 5 tokens per interval
      interval: 3600, // Refill every 60 minutes
      capacity: 5, // Bucket capacity of 5 token
        })
    ]
})

export default aj;