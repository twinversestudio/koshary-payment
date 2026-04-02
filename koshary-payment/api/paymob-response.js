module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method not allowed');
    }

    const success = req.query.success;
    const orderId = req.query.merchant_order_id;

    if (success === 'true') {
        const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم الدفع - كشري سيميوليتور</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white; 
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { text-align: center; padding: 40px; }
    .success {
      background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
      padding: 40px;
      border-radius: 20px;
      max-width: 400px;
    }
    .success h1 { font-size: 32px; margin-bottom: 20px; }
    .success p { font-size: 16px; opacity: 0.9; margin-bottom: 10px; }
    .emoji { font-size: 80px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">
      <div class="emoji">✅</div>
      <h1>تم الدفع بنجاح!</h1>
      <p>سيتم إضافة العملات لحسابك خلال دقائق</p>
      <p>رقم الطلب: ${orderId || 'غير معروف'}</p>
      <p style="margin-top: 20px; opacity: 0.7;">
        يمكنك إغلاق هذه الصفحة والعودة للعبة
      </p>
    </div>
  </div>
</body>
</html>
        `;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } else {
        const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم إلغاء الدفع - كشري سيميوليتور</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white; 
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { text-align: center; padding: 40px; }
    .failed {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      padding: 40px;
      border-radius: 20px;
      max-width: 400px;
    }
    .failed h1 { font-size: 28px; margin-bottom: 20px; }
    .failed p { font-size: 16px; opacity: 0.9; }
    .emoji { font-size: 80px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="failed">
      <div class="emoji">❌</div>
      <h1>تم إلغاء الدفع</h1>
      <p>يمكنك المحاولة مرة أخرى من اللعبة</p>
    </div>
  </div>
</body>
</html>
        `;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
};
