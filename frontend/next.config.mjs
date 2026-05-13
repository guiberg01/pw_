/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const backendBaseUrl = apiUrl ? apiUrl.replace(/\/api$/, "") : "http://localhost:3980";

const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https",
    hostname: "placehold.co",
  },
  {
    protocol: "http",
    hostname: "localhost",
    port: "3000",
  },
  {
    protocol: "http",
    hostname: "localhost",
    port: "3980",
  },
  { protocol: "https", hostname: "res.cloudinary.com" },
];

if (apiUrl) {
  try {
    const parsedUrl = new URL(apiUrl);

    remotePatterns.push({
      protocol: parsedUrl.protocol.replace(":", ""),
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || undefined,
    });
  } catch {
    remotePatterns.push({
      protocol: "http",
      hostname: "localhost",
      port: "3980",
    });
  }
}

const nextConfig = {
  images: {
    remotePatterns,
    dangerouslyAllowSVG: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl || "http://localhost:3980/api"}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendBaseUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
