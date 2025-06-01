/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/liquidity-pools',
                permanent: false,
            },
        ];
    },
};

export default nextConfig;