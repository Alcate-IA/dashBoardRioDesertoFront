/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '192.168.100.95',
                port: '3001',
                pathname: '/ver-fotos/**',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                os: false,
                net: false,
                stream: false,
                tls: false,
                crypto: false,
                child_process: false,
                encoding: false,
                debug: false,
                // ignore
            };
        }
        return config;
    },
    async rewrites() {
        return [
            {
                source: '/webhook-proxy/:path*',
                destination: 'http://192.168.100.95:5678/webhook/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
