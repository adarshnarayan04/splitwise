import express from "express";
import authRoutes from "./authRoutes.js";
import groupRoutes from "./groupRoutes.js";
import healthRoutes from "./healthRoutes.js";


const router = express.Router();


router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/groups", groupRoutes);

export default router;
