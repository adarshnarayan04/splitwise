import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/auth.js";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.get("Authorization");
  if (!header) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization header" });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded as any;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
