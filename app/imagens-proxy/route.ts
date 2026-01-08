import { NextRequest, NextResponse } from 'next/server';

// Prevent static caching of the proxy route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Failed to fetch image from ${url}: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.statusText}` },
                { status: response.status }
            );
        }

        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        return new NextResponse(blob, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Error in proxy route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
