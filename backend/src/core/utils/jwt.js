import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      tokenType: "access",
    },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenTtl },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.accessTokenSecret);
}
