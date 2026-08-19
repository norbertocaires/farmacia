import { Request } from 'express';
import * as requestIp from 'request-ip';
import * as geoip from 'geoip-lite';

export interface RequestLocation {
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  ll?: [number, number];
}

export interface RequestInfo {
  ipAddress: string | null;
  userAgent: string | null;
  location: RequestLocation | null;
}

export function extractRequestInfo(req: Request): RequestInfo {
  const ipAddress = requestIp.getClientIp(req);
  const userAgent = req.headers['user-agent'] ?? null;

  const normalizedIp = ipAddress?.replace('::ffff:', '') ?? null;
  const geo = normalizedIp ? geoip.lookup(normalizedIp) : null;

  const location: RequestLocation | null = geo
    ? {
      city: geo.city,
      region: geo.region,
      country: geo.country,
      timezone: geo.timezone,
      ll: geo.ll,
    }
    : null;

  return { ipAddress, userAgent, location };
}
