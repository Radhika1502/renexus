import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from "../../shared/utils/logger";

const router = Router();

// Configuration for the auth service proxy
const authServiceProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/', // rewrite path
  },
  logLevel: 'silent',
  onProxyReq: (proxyReq, req, res) => {
    logger.debug(`Proxying request to auth service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err });
    res.status(500).json({ 
      status: 'error',
      message: 'Authentication service unavailable',
      code: 'AUTH_SERVICE_UNAVAILABLE'
    });
  }
});

// Routes to proxy to the auth service
router.use('/', authServiceProxy);

export default router;

