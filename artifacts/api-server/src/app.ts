import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Restrict CORS to known first-party origins instead of a wildcard. The
// portal is served same-origin through the Replit proxy, so in practice the
// browser does not send a cross-origin request at all; this allowlist is a
// defence-in-depth measure so the credentialed auth API can never be called
// from an arbitrary third-party origin. Allowed origins are derived from the
// platform-provided domains ($REPLIT_DOMAINS, comma-separated, prod) plus the
// dev domain ($REPLIT_DEV_DOMAIN). Requests with no Origin header (curl,
// server-to-server, same-origin) are always allowed.
const allowedOrigins = new Set<string>();
for (const d of (process.env.REPLIT_DOMAINS ?? "").split(",")) {
  const host = d.trim();
  if (host) allowedOrigins.add(`https://${host}`);
}
if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
}

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    // No Origin header => not a browser cross-origin request (curl, health
    // probes, same-origin navigations). Allow it.
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    // Unknown origin: reject the CORS preflight/headers (does not throw the
    // request, the browser simply blocks the response).
    return callback(null, false);
  },
};

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
