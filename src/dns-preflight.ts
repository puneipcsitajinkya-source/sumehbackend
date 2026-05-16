import * as dns from 'node:dns';

// Helps `mongodb+srv` on Windows when IPv6 DNS path fails (querySrv ECONNREFUSED).
dns.setDefaultResultOrder('ipv4first');

// If your ISP/router DNS blocks SRV lookups, set MONGO_DNS_USE_PUBLIC=1 in .env
// so Node uses Google/Cloudflare resolvers for MongoDB (and everything else in this process).
const usePublic =
  process.env.MONGO_DNS_USE_PUBLIC === '1' ||
  process.env.MONGO_DNS_USE_PUBLIC === 'true';
if (usePublic) {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}
