module.exports = async (req, res) => {
  const playerId = req.query.player || 'unknown';
  
  const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شراء عملات - كشري سيميوليتور</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white; 
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 400px; margin: 0 auto; }
    
    .logo {
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 50px;
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
    }
    
    .header { text-align: center; padding: 20px 0; }
    .header h1 { font-size: 24px; color: #ffd700; margin-bottom: 10px; }
    .header p { color: #aaa; font-size: 14px; }
    
    .packages { margin: 20px 0; }
    .package { 
      background: rgba(255,255,255,0.1); 
      border: 2px solid transparent;
      border-radius: 15px; 
      padding: 15px; 
      margin: 10px 0;
      cursor: pointer;
      transition: all 0.3s;
    }
    .package:hover, .package.selected { 
      border-color: #ffd700;
      background: rgba(255,215,0,0.1);
    }
    .package .coins { 
      font-size: 22px; 
      font-weight: bold; 
      color: #ffd700;
    }
    .package .price { 
      font-size: 16px; 
      color: #4CAF50;
      margin-top: 5px;
    }
    
    .payment-section {
      display: none;
      margin-top: 20px;
    }
    .payment-section.show { display: block; }
    
    .payment-methods {
      margin-top: 20px;
    }
    .payment-methods h3 {
      margin-bottom: 15px;
      font-size: 16px;
      color: #ccc;
    }
    
    .pay-btn {
      background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
      color: white;
      border: none;
      padding: 18px;
      font-size: 18px;
      font-weight: bold;
      border-radius: 12px;
      cursor: pointer;
      width: 100%;
      margin-top: 20px;
      transition: transform 0.2s;
    }
    .pay-btn:hover { transform: scale(1.02); }
    .pay-btn:disabled {
      background: #555;
      cursor: not-allowed;
      transform: none;
    }
    
    .loading {
      text-align: center;
      padding: 30px;
      display: none;
    }
    .loading.show { display: block; }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #ffd700;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .success-message {
      background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
      padding: 30px;
      border-radius: 15px;
      text-align: center;
      display: none;
    }
    .success-message.show { display: block; }
    .success-message h2 { margin-bottom: 15px; font-size: 24px; }
    
    .payment-icons {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 15px;
      flex-wrap: wrap;
    }
    .payment-icon {
      background: rgba(255,255,255,0.1);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .error-message {
      background: #e74c3c;
      color: white;
      padding: 15px;
      border-radius: 10px;
      margin: 15px 0;
      display: none;
      text-align: center;
    }
    .error-message.show { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎮</div>
    
    <div class="header">
      <h1>كشري سيميوليتور</h1>
      <p>اختر الباقة اللي تناسبك</p>
    </div>
    
    <div class="packages">
      <div class="package" onclick="selectPackage(100, 10, this)">
        <div class="coins">💰 100 عملة</div>
        <div class="price">10 جنيه مصري</div>
      </div>
      
      <div class="package" onclick="selectPackage(500, 40, this)">
        <div class="coins">💰 500 عملة</div>
        <div class="price">40 جنيه مصري</div>
      </div>
      
      <div class="package" onclick="selectPackage(1000, 70, this)">
        <div class="coins">💰 1000 عملة</div>
        <div class="price">70 جنيه مصري</div>
      </div>
      
      <div class="package" onclick="selectPackage(5000, 300, this)">
        <div class="coins">💰 5000 عملة</div>
        <div class="price">300 جنيه مصري</div>
      </div>
    </div>
    
    <div class="payment-section" id="paymentSection">
      <div class="payment-methods">
        <h3>طرق الدفع المتاحة:</h3>
        <div class="payment-icons">
          <div class="payment-icon">💳 بطاقة بنكية</div>
          <div class="payment-icon">📱 فودافون كاش</div>
          <div class="payment-icon">🏦 إنستا باي</div>
          <div class="payment-icon">💳 تيلدا</div>
          <div class="payment-icon">🏧 الدفع بالكود</div>
        </div>
      </div>
      
      <button class="pay-btn" id="payBtn" onclick="startPayment()">
        💳 ادفع الآن
      </button>
    </div>
    
    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p>جاري تحميل الدفع...</p>
    </div>
    
    <div class="error-message" id="errorMessage"></div>
    
    <div class="success-message" id="successMessage">
      <h2>✅ تم الدفع بنجاح!</h2>
      <p>سيتم إضافة العملات لحسابك خلال دقائق</p>
      <p style="margin-top: 15px; font-size: 13px; opacity: 0.9;">
        اغلق الصفحة وافتح اللعبة مرة أخرى
      </p>
    </div>
  </div>

  <script src="https://accept.paymob.com/sdk/v1/key.js"></script>
  <script>
    const playerId = '${playerId}';
    let selectedCoins = 0;
    let selectedPrice = 0;
    let paymentToken = null;
    let orderId = null;
    
    function selectPackage(coins, price, element) {
      selectedCoins = coins;
      selectedPrice = price;
      
      document.querySelectorAll('.package').forEach(p => p.classList.remove('selected'));
      element.classList.add('selected');
      
      document.getElementById('paymentSection').classList.add('show');
      document.getElementById('payBtn').disabled = false;
    }
    
    async function startPayment() {
      if (selectedPrice === 0) {
        showError('اختر باقة أولاً');
        return;
      }
      
      document.getElementById('payBtn').disabled = true;
      document.getElementById('loading').classList.add('show');
      hideError();
      
      try {
        const response = await fetch('/api/paymob-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: playerId,
            amount: selectedCoins,
            price: selectedPrice
          })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'حدث خطأ');
        }
        
        paymentToken = data.paymentToken;
        orderId = data.orderId;
        const publicKey = data.publicKey;
        
        document.getElementById('loading').classList.remove('show');
        
        const paymob = new Paymob(publicKey);
        
        paymob.checkout({
          paymentToken: paymentToken,
          appearance: {
            mode: "overlay",
            theme: "dark",
            backgroundColor: "#1a1a2e"
          }
        }).then((confirmation) => {
          if (confirmation.success) {
            showSuccess();
          } else if (confirmation.pending) {
            showSuccess();
          } else {
            showError('تم إلغاء الدفع');
            document.getElementById('payBtn').disabled = false;
          }
        }).catch((error) => {
          console.error('Paymob error:', error);
          showError('حدث خطأ في الدفع: ' + (error.message || 'حاول مرة أخرى'));
          document.getElementById('payBtn').disabled = false;
        });
        
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('loading').classList.remove('show');
        showError(error.message || 'حدث خطأ. حاول مرة أخرى');
        document.getElementById('payBtn').disabled = false;
      }
    }
    
    function showError(msg) {
      const el = document.getElementById('errorMessage');
      el.textContent = msg;
      el.classList.add('show');
    }
    
    function hideError() {
      document.getElementById('errorMessage').classList.remove('show');
    }
    
    function showSuccess() {
      document.getElementById('paymentSection').classList.remove('show');
      document.getElementById('successMessage').classList.add('show');
    }
  </script>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
