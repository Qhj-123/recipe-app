import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: base64Data, folder } = req.body;
    if (!base64Data) return res.status(400).json({ error: '缺少图片数据' });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const uploadFolder = folder || 'restaurant-photos';

    // 生成签名
    const sigStr = `folder=${uploadFolder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha256').update(sigStr).digest('hex');

    // 构建 FormData
    const formData = new URLSearchParams();
    formData.append('file', base64Data);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', uploadFolder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (result.error) return res.status(400).json({ error: result.error.message });

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
