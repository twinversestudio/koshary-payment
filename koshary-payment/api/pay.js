// ?? ?????? ???? ?????? ??????

module.exports = async (req, res) => {
    const playerId = req.query.player || 'unknown';

    const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>???? ????? - ???? ??????????</title>
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
    .header { text-align: center; padding: 30px 0; }
    .header h1 { font-size: 28px; color: #ffd700; margin-bottom: 10px; }
    .header p { color: #aaa; }
    
    .packages { margin: 20px 0; }
    .package { 
      background: rgba(255,255,255,0.1); 
      border: 2px solid transparent;
      border-radius: 15px; 
      padding: 20px; 
      margin: 15px 0;
      cursor: pointer;
      transition: all 0.3s;
    }
    .package:hover, .package.selected { 
      border-color: #ffd700;
      background: rgba(255,215,0,0.1);
    }
    .package .coins { 
      font-size: 24px; 
      font-weight: bold; 
      color: #ffd700;
    }
    .package .price { 
      font-size: 18px; 
      color: #4CAF50;
      margin-top: 5px;
    }
    
    .payment-methods { 
      display: none;
      margin-top: 20px;
    }
    .payment-methods.show { display: block; }
    
    .method { 
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 15px;
      margin: 10px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .method:hover { background: rgba(255,255,255,0.1); }
    .method-icon { font-size: 24px; }
    
    .instapay-info {
      background: #4CAF50;
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: center;
      display: none;
    }
    .instapay-info.show { display: block; }
    .instapay-id {
      font-size: 20px;
      font-weight: bold;
      background: rgba(0,0,0,0.2);
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
      user-select: all;
    }
    
    .confirm-btn {
      background: #ffd700;
      color: #1a1a2e;
      border: none;
      padding: 15px 30px;
      font-size: 18px;
      font-weight: bold;
      border-radius: 10px;
      cursor: pointer;
      width: 100%;
      margin-top: 20px;
      display: none;
    }
    .confirm-btn.show { display: block; }
    .confirm-btn:hover { background: #ffed4e; }
    
    .success-message {
      background: #4CAF50;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      display: none;
    }
    .success-message.show { display: block; }
    
    .loading {
      text-align: center;
      padding: 20px;
      display: none;
    }
    .loading.show { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>?? ???? ??????????</h1>
      <p>???? ?????? ???? ??????</p>
    </div>
    
    <div class="packages">
      <div class="package" onclick="selectPackage(100, 10, this)">
        <div class="coins">?? 100 ????</div>
        <div class="price">10 ???? ????</div>
      </div>
      
      <div class="package" onclick="selectPackage(500, 40, this)">
        <div class="coins">?? 500 ????</div>
        <div class="price">40 ???? ????</div>
      </div>
      
      <div class="package" onclick="selectPackage(1000, 70, this)">
        <div class="coins">?? 1000 ????</div>
        <div class="price">70 ???? ????</div>
      </div>
      
      <div class="package" onclick="selectPackage(5000, 300, this)">
        <div class="coins">?? 5000 ????</div>
        <div class="price">300 ???? ????</div>
      </div>
    </div>
    
    <div class="payment-methods" id="paymentMethods">
      <h3 style="margin-bottom: 15px;">???? ????? ?????:</h3>
      
      <div class="method" onclick="selectMethod('vodafone')">
        <span class="method-icon">??</span>
        <span>??????? ???</span>
      </div>
      
      <div class="method" onclick="selectMethod('instapay')">
        <span class="method-icon">??</span>
        <span>????? ???</span>
      </div>
      
      <div class="method" onclick="selectMethod('telda')">
        <span class="method-icon">??</span>
        <span>?????</span>
      </div>
      
      <div class="method" onclick="selectMethod('card')">
        <span class="method-icon">??</span>
        <span>????? ????? (????)</span>
      </div>
    </div>
    
    <div class="instapay-info" id="instapayInfo">
      <p>? ?? ??????: <span id="selectedAmount">---</span> ????</p>
      <p>??????: <span id="selectedPrice">---</span> ????</p>
      <hr style="margin: 15px 0; opacity: 0.3;">
      <p>???? ?????? ???:</p>
      <div class="instapay-id">bankmisr.youssef@instapay</div>
      <p style="font-size: 14px; margin-top: 10px;">
        ?? ???? ????? ????? ????? ?????
      </p>
    </div>
    
    <div class="loading" id="loading">
      ? ???? ?????? ????...
    </div>
    
    <div class="success-message" id="successMessage">
      <h2>? ?? ?????? ????!</h2>
      <p>???? ????? ??????? ?????? ???? ?????</p>
      <p style="margin-top: 15px; font-size: 14px;">
        ???? ?????? ????? ?????? ??? ????
      </p>
    </div>
    
    <button class="confirm-btn" id="confirmBtn" onclick="confirmPayment()">
      ?? ??????? ?
    </button>
  </div>

  <script>
    const playerId = '${playerId}';
    let selectedCoins = 0;
    let selectedPrice = 0;
    let selectedMethod = '';
    
    function selectPackage(coins, price, element) {
      selectedCoins = coins;
      selectedPrice = price;
      
      // ??? ??????? ?? ????
      document.querySelectorAll('.package').forEach(p => p.classList.remove('selected'));
      element.classList.add('selected');
      
      // ???? ??? ?????
      document.getElementById('paymentMethods').classList.add('show');
      
      // ???? ???? ????
      document.getElementById('instapayInfo').classList.remove('show');
      document.getElementById('confirmBtn').classList.remove('show');
    }
    
    function selectMethod(method) {
      selectedMethod = method;
      
      // ???? ??????? ????? ??? (?? ????? ???? ?????? ???)
      document.getElementById('selectedAmount').textContent = selectedCoins;
      document.getElementById('selectedPrice').textContent = selectedPrice;
      document.getElementById('instapayInfo').classList.add('show');
      document.getElementById('confirmBtn').classList.add('show');
      
      // ?? ????? ??? ?????? ???? ???????
      if (method === 'instapay') {
        window.location.href = 'https://ipn.instapay.dev/e/bankmisr.youssef@instapay?amount=' + selectedPrice;
      }
    }
    
    async function confirmPayment() {
      document.getElementById('confirmBtn').classList.remove('show');
      document.getElementById('loading').classList.add('show');
      
      try {
        const response = await fetch('/api/create-order', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            playerId: playerId,
            amount: selectedCoins,
            price: selectedPrice,
            method: selectedMethod
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          document.getElementById('loading').classList.remove('show');
          document.getElementById('successMessage').classList.add('show');
        }
      } catch (error) {
        alert('??? ???? ???? ??? ????');
        document.getElementById('loading').classList.remove('show');
        document.getElementById('confirmBtn').classList.add('show');
      }
    }
  </script>
</body>
</html>
  `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
};