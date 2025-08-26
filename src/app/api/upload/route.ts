
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration is now centralized and read from process.env
// which should be populated by Next.js from the .env file.
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Convert file to buffer to be sent to Cloudinary
    const fileBuffer = await file.arrayBuffer();
    const mimeType = file.type;
    const encoding = 'base64';
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    const fileUri = 'data:' + mimeType + ';' + encoding + ',' + base64Data;


    const result = await cloudinary.uploader.upload(fileUri, {
      folder: 'atitlan_aquahub_uploads',
      resource_type: 'auto',
    });

    return NextResponse.json({
        url: result.secure_url,
        type: result.resource_type,
    });

  } catch (error: any) {
    console.error('A critical error occurred in the POST handler:', error);
    // Provide a more generic error message to the client for security
    return NextResponse.json({ error: error.message || 'Internal Server Error during file upload.' }, { status: 500 });
  }
}
