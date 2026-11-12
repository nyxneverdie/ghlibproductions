import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth/config.js";

const handler = toNodeHandler(auth);

export default function authHandler(req, res) {
  // Vercel's rewrite routes all Better Auth endpoints to this single function.
  const url = new URL(req.url, "http://localhost");
  const path = url.searchParams.get("auth_path") || "";
  url.searchParams.delete("auth_path");
  req.url = `/api/auth/${path}${url.search}`;
  return handler(req, res);
}
