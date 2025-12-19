import { Request, Response, NextFunction } from "express";
import { createUser, findUserByEmail } from "../lib/store.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      const err: any = new Error("email, password, and name are required");
      err.status = 400;
      throw err;
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      const err: any = new Error("Email already in use");
      err.status = 409;
      throw err;
    }
    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, name, passwordHash });
    const token = signToken({ userId: user.id, email: user.email });
    return res
      .status(201)
      .json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err: any = new Error("email and password are required");
      err.status = 400;
      throw err;
    }
    const user = await findUserByEmail(email);
    if (!user) {
      const err: any = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      const err: any = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    const token = signToken({ userId: user.id, email: user.email });
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    return next(err);
  }
}
