import { redis } from "../utils/redis.js";

export const getUserById = async (id, res) => {

    const userData = await redis.get(id);

    if (userData) {
        const user = JSON.parse(userData)
        res.status(201).json({
            success: true,
            user
        });
    }
}