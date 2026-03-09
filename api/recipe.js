export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, region, size } = req.body;
  if (!input) return res.status(400).json({ error: 'Missing input' });

  const rMap = {
    'mien-nam': 'miền Nam Việt Nam (thích vị ngọt nhẹ, hay dùng nước cốt dừa, đường, ăn với cơm trắng)',
    'mien-trung': 'miền Trung Việt Nam (vị đậm đà, cay mặn, nhiều mắm)',
    'mien-bac': 'miền Bắc Việt Nam (thanh đạm, ít ngọt, nước trong, gia vị vừa phải)'
  };
  const regionDesc = rMap[region] || 'Việt Nam';
  const sizeDesc = size || '2-3 người';

  const prompt = `Bạn là đầu bếp Việt Nam 20 năm kinh nghiệm nấu ăn gia đình ${regionDesc}.
Nấu cho ${sizeDesc}. Luôn gợi ý món ăn với cơm trắng là ưu tiên số 1.

QUY TẮC:
- Chỉ gợi ý món Việt Nam hoặc món Á phổ biến ở Việt Nam
- Ưu tiên món quen thuộc, dễ nấu, nguyên liệu đơn giản
- KHÔNG gợi ý pasta, pizza, sandwich, salad kiểu Tây
- Thời gian nấu phải thực tế (không phóng đại)
- Nêm nếm theo khẩu vị vùng miền đã cho

Tôi có: ${input}
Gợi ý 3 món ngon nhất.

Trả về JSON thuần, KHÔNG markdown, KHÔNG text thừa, KHÔNG giải thích:
{"mon":[{"ten":"Tên món","emoji":"emoji","thoi_gian":"X phút","do_kho":"Dễ","mo_ta":"Mô tả ngắn hấp dẫn 1-2 câu","co":["nl có sẵn"],"them":["nl cần thêm nếu có"],"buoc":["Bước 1","Bước 2","Bước 3","Bước 4","Bước 5"]}]}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error(JSON.stringify(data)); // Log toàn bộ response để debug

    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'AI error', detail: err.message });
  }
}
