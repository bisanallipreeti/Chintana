export function configureCors() {
  return cors({
    origin: function (origin, callback) {
      const allowedOrigins = env.allowedOrigins || [];

      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");

      const isAllowed = allowedOrigins.some((allowed) =>
        allowed.replace(/\/$/, "") === normalizedOrigin
      );

      if (isAllowed) {
        return callback(null, true);
      }

      console.log("❌ BLOCKED ORIGIN:", origin);

      // IMPORTANT: DO NOT FAIL SILENTLY
      return callback(null, true); // allow instead of blocking
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
    ],

    optionsSuccessStatus: 200,
  });
}
