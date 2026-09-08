import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  let filename = searchParams.get('filename') || 'download';

  if (!url) {
    return new NextResponse('Missing URL parameter', {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Remote server responded with ${response.status}`);

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    
    // Attempt to guess extension if filename has none
    if (!filename.includes('.') && contentType.includes('/')) {
        const ext = contentType.split('/')[1].split(';')[0];
        if (ext) filename = `${filename}.${ext}`;
    }

    const blob = await response.arrayBuffer();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Proxy Download Error:', error);
    return new NextResponse(`Download Failed: ${error.message}`, {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
