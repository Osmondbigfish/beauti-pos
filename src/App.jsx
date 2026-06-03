import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, BarChart3, Search, Plus, Minus, X, 
  CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle, Download, Send, FileDown 
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const companyInfo = {
  name: "麗明珠真髮中心",
  english: "BEAUTI HAIR CENTRE",
  since: "Since 1991",
  address: "金馬倫道金馬倫廣場16樓C室",
  phone: "2722 7924",
  whatsapp: "9404 2430",
  email: "info@beautihaircentre.com",
  hours: "星期一至六 10:00 – 19:00",
  terms: "憑單取髮，三個月限期，逾期作廢。如頭髮日久失修等造成變色或損壞，本公司概不負責賠償。本公司會小心處理客人所交託洗恤的假髮，但如果非人為所造成的災禍，本公司概不負責。"
};

const initialItems = [
  { id: 1, name: "優質短直真髮假髮 (自然黑)", price: 1280, type: "product", stock: 8, category: "假髮", requiresProcessing: true, defaultProcessingDays: 4 },
  { id: 2, name: "長捲真髮假髮 (棕色)", price: 1680, type: "product", stock: 5, category: "假髮", requiresProcessing: true, defaultProcessingDays: 5 },
  { id: 3, name: "高級真髮假髮護理套裝", price: 380, type: "product", stock: 22, category: "假髮用品", requiresProcessing: false },
  { id: 4, name: "假髮專用清潔噴霧 (250ml)", price: 128, type: "product", stock: 35, category: "假髮用品", requiresProcessing: false },
  { id: 5, name: "真髮假髮洗護造型服務", price: 450, type: "service", stock: null, duration: "約3-5天加工", category: "洗護服務", requiresProcessing: true, defaultProcessingDays: 4 },
  { id: 6, name: "假髮專業染色服務", price: 680, type: "service", stock: null, duration: "約5天加工", category: "洗護服務", requiresProcessing: true, defaultProcessingDays: 5 },
  { id: 7, name: "假髮修剪調整服務", price: 280, type: "service", stock: null, duration: "即日可取", category: "洗護服務", requiresProcessing: false },
  { id: 8, name: "真髮假髮深層護理套餐", price: 880, type: "service", stock: null, duration: "約4天加工", category: "洗護服務", requiresProcessing: true, defaultProcessingDays: 4 },
];

const paymentMethods = [
  { id: 'cash', label: '現金', icon: Banknote },
  { id: 'card', label: '信用卡 / 扣帳卡', icon: CreditCard },
  { id: 'alipay', label: 'AlipayHK', icon: Smartphone },
  { id: 'wechat', label: 'WeChat Pay', icon: Smartphone },
  { id: 'octopus', label: '八達通', icon: CreditCard },
];

function App() {
  const [activeTab, setActiveTab] = useState('sales');
  const [items, setItems] = useState(initialItems);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [toast, setToast] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomerForCheckout, setSelectedCustomerForCheckout] = useState(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', price: '', type: 'product', category: '', requiresProcessing: false, defaultProcessingDays: 4, stock: ''
  });

  // 日期範圍
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const savedItems = localStorage.getItem('pos_items');
    if (savedItems) setItems(JSON.parse(savedItems));
    const savedTransactions = localStorage.getItem('pos_transactions');
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    const savedCustomers = localStorage.getItem('pos_customers');
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
  }, []);

  useEffect(() => { localStorage.setItem('pos_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('pos_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('pos_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('pos_customers', JSON.stringify(customers)); }, [customers]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = Math.max(0, subtotal - discountAmount);

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    (categoryFilter === '全部' || item.category === categoryFilter))
    .sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name, 'zh-HK') : (a.type === 'product' ? -1 : 1));

  const getAllCustomersForSearch = () => {
    const map = new Map();
    customers.forEach(c => {
      const key = c.phone || c.name;
      if (!map.has(key)) map.set(key, c);
    });
    transactions.forEach(tx => {
      if (tx.customerName || tx.customerPhone) {
        const key = tx.customerPhone || tx.customerName;
        if (!map.has(key)) {
          map.set(key, { name: tx.customerName || '未填寫', phone: tx.customerPhone || '' });
        }
      }
    });
    return Array.from(map.values());
  };

  const allCustomers = getAllCustomersForSearch();

  const getCustomerSuggestions = (keyword) => {
    if (!keyword) return [];
    const lower = keyword.toLowerCase();
    return allCustomers.filter(c =>
      c.name.toLowerCase().includes(lower) || c.phone.includes(keyword)
    ).slice(0, 6);
  };

  const customerSuggestions = getCustomerSuggestions(customerSearchTerm);

  const selectCustomer = (customer) => {
    setSelectedCustomerForCheckout(customer);
    setCustomerSearchTerm(customer.name);
    setShowCustomerSuggestions(false);
  };

  const openAddCustomerModal = () => {
    setNewCustomer({ name: '', phone: '' });
    setIsAddCustomerModalOpen(true);
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name) {
      showToast('請輸入客戶姓名', 'error');
      return;
    }
    const exists = customers.some(c => c.name === newCustomer.name && c.phone === newCustomer.phone);
    if (exists) {
      showToast('此客戶已存在', 'error');
      return;
    }
    const newCust = { id: Date.now(), name: newCustomer.name.trim(), phone: newCustomer.phone.trim() };
    setCustomers(prev => [...prev, newCust]);
    setIsAddCustomerModalOpen(false);
    showToast('客戶新增成功！', 'success');
  };

  const openAddItemModal = () => {
    setNewItem({
      name: '',
      price: '',
      type: 'product',
      category: '',
      requiresProcessing: false,
      defaultProcessingDays: 4,
      stock: ''
    });
    setIsAddItemModalOpen(true);
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      showToast('請填寫名稱、價格與類別', 'error');
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: newItem.name,
      price: parseInt(newItem.price),
      type: newItem.type,
      category: newItem.category,
      requiresProcessing: newItem.requiresProcessing,
      defaultProcessingDays: newItem.requiresProcessing ? parseInt(newItem.defaultProcessingDays) : null,
      stock: newItem.type === 'product' ? (parseInt(newItem.stock) || 0) : null,
      duration: newItem.type === 'service' ? '約3-5天加工' : null
    };

    setItems(prev => [...prev, newProduct]);
    setIsAddItemModalOpen(false);
    showToast('商品/服務已成功新增！', 'success');
  };

  const addToCart = (item) => {
    if (item.type === 'product' && item.stock !== null) {
      const inCart = cart.find(c => c.id === item.id);
      if ((inCart ? inCart.qty : 0) + 1 > item.stock) {
        showToast('庫存不足！', 'error');
        return;
      }
    }
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      } else {
        let newItem = { ...item, qty: 1 };
        if (item.requiresProcessing) {
          const d = new Date();
          d.setDate(d.getDate() + (item.defaultProcessingDays || 4));
          newItem.pickupDate = d.toISOString().split('T')[0];
        }
        return [...prev, newItem];
      }
    });
    showToast(`${item.name} 已加入購物車`, 'success');
  };

  const updateCartQty = (id, newQty) => {
    if (newQty < 1) return;
    const item = items.find(i => i.id === id);
    if (item?.type === 'product' && item.stock !== null && newQty > item.stock) {
      showToast('超過可用庫存', 'error');
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const updatePickupDate = (id, newDate) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, pickupDate: newDate } : item));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => { setCart([]); setDiscountPercent(0); };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const generateInvoiceNumber = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastInvoice = localStorage.getItem('last_invoice_number');
    let sequence = 1;
    if (lastInvoice && lastInvoice.startsWith(`INV-${today}`)) {
      const lastSeq = parseInt(lastInvoice.split('-')[2]);
      sequence = lastSeq + 1;
    }
    const invoiceNumber = `INV-${today}-${sequence.toString().padStart(3, '0')}`;
    localStorage.setItem('last_invoice_number', invoiceNumber);
    return invoiceNumber;
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
    setSelectedPayment('cash');
    setPaidAmount(total.toString());
    setCheckoutError('');
    setCustomerSearchTerm('');
    setSelectedCustomerForCheckout(null);
    setShowCustomerSuggestions(false);
    setIsPaymentModalOpen(true);
  };

  const processCheckout = () => {
    let change = 0;
    const paid = parseFloat(paidAmount) || 0;
    if (selectedPayment === 'cash' && paid < total) {
      setCheckoutError('支付金額不足');
      return;
    }
    if (selectedPayment === 'cash') change = paid - total;

    const invoiceNumber = generateInvoiceNumber();

    const txItems = cart.map(item => ({
      ...item,
      requiresProcessing: item.requiresProcessing || false,
      pickupDate: item.pickupDate || null
    }));

    const newTransaction = {
      id: Date.now(),
      invoiceNumber,
      time: new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      items: txItems,
      subtotal, discount: discountAmount, total,
      paymentMethod: paymentMethods.find(m => m.id === selectedPayment)?.label,
      change,
      customerName: selectedCustomerForCheckout?.name || customerSearchTerm || null,
      customerPhone: selectedCustomerForCheckout?.phone || null,
      company: companyInfo
    };

    const updatedItems = items.map(item => {
      const cartItem = cart.find(c => c.id === item.id);
      if (cartItem && item.type === 'product' && item.stock !== null) {
        return { ...item, stock: Math.max(0, item.stock - cartItem.qty) };
      }
      return item;
    });

    setItems(updatedItems);
    setTransactions(prev => [newTransaction, ...prev]);
    setIsPaymentModalOpen(false);
    setPaidAmount('');
    setCheckoutError('');
    setLastTransaction(newTransaction);

    setIsSuccessModalOpen(true);

    setTimeout(() => {
      clearCart();
      setCustomerSearchTerm('');
      setSelectedCustomerForCheckout(null);
    }, 300);
  };

  const closePaymentModal = () => { 
    setIsPaymentModalOpen(false); 
    setCheckoutError(''); 
    setShowCustomerSuggestions(false);
  };

  const closeSuccessModal = () => { setIsSuccessModalOpen(false); setLastTransaction(null); };

  // ==================== 即時編印功能 ====================
  const printReceipt = (transaction) => {
    if (!transaction) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('請允許彈出視窗使用列印功能');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${transaction.invoiceNumber}</title>
          <style>
            @media print { @page { size: 80mm auto; margin: 4mm; } }
            body { font-family: system-ui, sans-serif; padding: 10px; line-height: 1.4; font-size: 12px; }
            .header { text-align: center; margin-bottom: 8px; }
            .logo { height: 55px; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 5px 7px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" class="logo" />
            <h2 style="margin:0; color:#9f1239; font-size:14px;">${companyInfo.name}</h2>
            <p style="margin:0; color:#9f1239; font-size:10px;">${companyInfo.english}</p>
          </div>
          <h3 style="text-align:center; font-size:13px; margin:6px 0;">收 據 RECEIPT</h3>
          <p style="font-size:11px; margin-bottom:8px;">
            訂單編號：${transaction.invoiceNumber}<br>
            日期：${transaction.date} ${transaction.time}<br>
            ${transaction.customerName ? `客戶：${transaction.customerName}<br>` : ''}
            ${transaction.customerPhone ? `電話：${transaction.customerPhone}<br>` : ''}
          </p>
          <table>
            <thead><tr style="background:#374151; color:white;"><th>項目</th><th>數量</th><th style="text-align:right">小計</th></tr></thead>
            <tbody>
              ${transaction.items.map(item => `
                <tr>
                  <td>${item.name} ×${item.qty}</td>
                  <td>${item.qty}</td>
                  <td style="text-align:right">HK$${(item.price * item.qty).toFixed(0)}</td>
                </tr>
                ${item.pickupDate ? `<tr><td colspan="3" style="color:#c2416f; font-size:10px;">→ 預計取貨：${item.pickupDate}</td></tr>` : ''}
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            總金額：HK$${transaction.total}<br>
            支付方式：${transaction.paymentMethod}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const printInvoice = (transaction) => {
  if (!transaction) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert('請允許彈出視窗使用列印功能');

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice - ${transaction.invoiceNumber}</title>
        <style>
          @media print { @page { size: A5 portrait; margin: 6mm; } }
          body { font-family: "Noto Sans TC", "PingFang TC", system-ui, sans-serif; padding: 8mm; line-height: 1.5; font-size: 10px; color: #374151; }
          .header { text-align: center; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5px; }
          th, td { padding: 5px 6px; border-bottom: 1px solid #f1f5f9; }
          th { background: #f8fafc; font-weight: 600; }
          .total { text-align: right; font-size: 10px; }
          .thankyou { text-align: right; font-size: 11px; color: #6b7280; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" style="height:72px; margin-bottom:6px;" />
          <div style="font-size:19px; font-weight:700; color:#4c1d95;">INVOICE</div>
          <div style="font-size:11.5px; color:#6b7280;">麗明珠真髮中心</div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:9.5px;">
          <div>
            <strong style="font-size:8.5px; color:#6b7280;">BILLED TO</strong><br>
            ${transaction.customerName || '客戶'}<br>
            ${transaction.customerPhone || ''}
          </div>
          <div style="text-align:right;">
            <strong style="font-size:8.5px; color:#6b7280;">INVOICE NO</strong><br>
            ${transaction.invoiceNumber}<br>
            <strong style="font-size:8.5px; color:#6b7280;">DATE</strong><br>
            ${transaction.date}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align:left;">項目</th>
              <th style="text-align:center;">數量</th>
              <th style="text-align:right;">單價</th>
              <th style="text-align:right;">小計</th>
            </tr>
          </thead>
          <tbody>
            ${transaction.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:right;">HK$${item.price}</td>
                <td style="text-align:right;">HK$${(item.price * item.qty).toFixed(0)}</td>
              </tr>
              ${item.pickupDate ? `<tr><td colspan="4" style="color:#c026d3; font-size:8.5px;">→ 預計取貨日期：${item.pickupDate}</td></tr>` : ''}
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          小計：HK$${transaction.subtotal}<br>
          ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
          <strong style="font-size:12px; color:#4c1d95;">總金額：HK$${transaction.total}</strong><br>
          支付方式：${transaction.paymentMethod}
        </div>

        <div class="thankyou">Thank you for your business!</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
};

  // ==================== WhatsApp 發送功能 ====================
  const sendToWhatsApp = (transaction) => {
    if (!transaction) return;
    const phone = transaction.customerPhone ? transaction.customerPhone.replace(/\s/g, '') : '';
    const hasPickup = transaction.items.some(i => i.pickupDate);

    const message = `麗明珠真髮中心 訂單確認\n\n訂單編號：${transaction.invoiceNumber}\n客戶：${transaction.customerName || '尊貴客戶'}\n總金額：HK$${transaction.total}\n支付方式：${transaction.paymentMethod}\n${hasPickup ? `取貨日期：${transaction.items.find(i => i.pickupDate)?.pickupDate}\n` : ''}請查看附件發票。\n\n${companyInfo.name}\nTel: ${companyInfo.phone} ｜ WhatsApp: ${companyInfo.whatsapp}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // ==================== PDF 生成（優雅風格） ====================
  const generateReceiptPDF = async (transaction) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '80mm';
    tempDiv.style.padding = '5mm';
    tempDiv.style.background = '#ffffff';
    tempDiv.style.fontFamily = 'system-ui, sans-serif';
    tempDiv.style.fontSize = '11.5px';

    tempDiv.innerHTML = `
      <div style="text-align:center; margin-bottom:5px">
        <img src="/logo.png" style="height:60px; margin-bottom:3px; display:block; margin-left:auto; margin-right:auto;" />
        <h2 style="margin:0; color:#9f1239; font-size:14px; font-weight:700;">${companyInfo.name}</h2>
        <p style="margin:0; color:#9f1239; font-size:10px;">${companyInfo.english}</p>
      </div>
      <div style="text-align:center; font-weight:700; font-size:13px; margin-bottom:6px;">收 據 RECEIPT</div>
      <div style="font-size:10.5px; margin-bottom:6px; line-height:1.45;">
        發票編號：${transaction.invoiceNumber}<br>
        日期時間：${transaction.date} ${transaction.time}<br>
        ${transaction.customerName ? `客戶：${transaction.customerName}<br>` : ''}
        ${transaction.customerPhone ? `電話：${transaction.customerPhone}<br>` : ''}
      </div>
      <div style="border-radius:10px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
        <table style="width:100%; border-collapse:collapse; font-size:10.5px;">
          <thead><tr style="background:#374151; color:white;"><th style="padding:5px 7px;">項目</th><th style="padding:5px 7px;">數量</th><th style="padding:5px 7px; text-align:right">小計</th></tr></thead>
          <tbody>
            ${transaction.items.map(item => `
              <tr style="background:#fff;">
                <td style="padding:5px 7px; border-bottom:1px solid #f3e8ff;">${item.name} ×${item.qty}</td>
                <td style="padding:5px 7px; border-bottom:1px solid #f3e8ff;">${item.qty}</td>
                <td style="padding:5px 7px; text-align:right; border-bottom:1px solid #f3e8ff;">HK$${(item.price * item.qty).toFixed(0)}</td>
              </tr>
              ${item.pickupDate ? `<tr><td colspan="3" style="color:#c2416f; font-size:9.5px; padding:3px 7px;">→ 預計取貨：${item.pickupDate}</td></tr>` : ''}
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="text-align:right; font-size:12px; margin-top:8px;">
        <strong style="font-size:14px; color:#9f1239;">總金額：HK$${transaction.total}</strong><br>
        支付方式：${transaction.paymentMethod}
      </div>
    `;

    document.body.appendChild(tempDiv);
    const canvas = await html2canvas(tempDiv, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
    pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
    pdf.save(`Receipt_${transaction.invoiceNumber}.pdf`);
    document.body.removeChild(tempDiv);
  };

 const generateInvoicePDF = async (transaction) => {
  const margin = 5;
  const pageWidth = 148;
  const contentWidth = pageWidth - (margin * 2);

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = `${contentWidth}mm`;
  tempDiv.style.padding = '5mm';
  tempDiv.style.background = '#ffffff';
  tempDiv.style.border = '1px solid #d1d5db';
  tempDiv.style.borderRadius = '3px';
  tempDiv.style.fontFamily = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif';
  tempDiv.style.fontSize = '9.5px';
  tempDiv.style.lineHeight = '1.45';
  tempDiv.style.color = '#374151';

  tempDiv.innerHTML = `
    <div style="text-align:center; margin-bottom:6px">
      <img src="/logo.png" style="height:78px; margin-bottom:6px; display:block; margin-left:auto; margin-right:auto;" />
      <div style="font-size:19px; font-weight:700; color:#4c1d95;">INVOICE</div>
      <div style="font-size:11.5px; color:#6b7280; margin-top:1px;">麗明珠真髮中心</div>
    </div>

    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:9.5px;">
      <div>
        <strong style="font-size:8.5px; color:#6b7280;">BILLED TO</strong><br>
        ${transaction.customerName || '客戶'}<br>
        ${transaction.customerPhone || ''}
      </div>
      <div style="text-align:right;">
        <strong style="font-size:8.5px; color:#6b7280;">INVOICE NO</strong><br>
        ${transaction.invoiceNumber}<br>
        <strong style="font-size:8.5px; color:#6b7280;">DATE</strong><br>
        ${transaction.date}
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:9px;">
      <thead>
        <tr style="background:#f8fafc; border-bottom:1px solid #e5e7eb;">
          <th style="padding:5px 6px; text-align:left; font-weight:600;">項目</th>
          <th style="padding:5px 6px; text-align:center; width:9%;">數量</th>
          <th style="padding:5px 6px; text-align:right; width:14%;">單價</th>
          <th style="padding:5px 6px; text-align:right; width:14%;">小計</th>
        </tr>
      </thead>
      <tbody>
        ${transaction.items.map(item => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 6px;">${item.name}</td>
            <td style="padding:5px 6px; text-align:center;">${item.qty}</td>
            <td style="padding:5px 6px; text-align:right;">HK$${item.price}</td>
            <td style="padding:5px 6px; text-align:right;">HK$${(item.price * item.qty).toFixed(0)}</td>
          </tr>
          ${item.pickupDate ? `<tr><td colspan="4" style="padding:2px 6px; font-size:8px; color:#c026d3;">→ 預計取貨日期：${item.pickupDate}</td></tr>` : ''}
        `).join('')}
      </tbody>
    </table>

    <div style="text-align:right; font-size:9.5px; margin-bottom:10px;">
      小計：HK$${transaction.subtotal}<br>
      ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
      <span style="font-size:12px; font-weight:700; color:#4c1d95;">總金額：HK$${transaction.total}</span><br>
      <span style="font-size:8.5px;">支付方式：${transaction.paymentMethod}</span>
    </div>

    <div style="text-align:right; font-size:10.5px; color:#6b7280; margin-top:8px;">
      Thank you for your business!
    </div>
  `;

  document.body.appendChild(tempDiv);

  const canvas = await html2canvas(tempDiv, { scale: 3.5, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [148, 210] });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth - (margin * 2), pdfHeight);
  pdf.save(`Invoice_${transaction.invoiceNumber}_A5.pdf`);

  document.body.removeChild(tempDiv);
};

  // ==================== 匯出 Excel ====================
  const exportToExcel = () => {
    let filteredTransactions = [...transactions];

    if (startDate) filteredTransactions = filteredTransactions.filter(tx => tx.date >= startDate);
    if (endDate) filteredTransactions = filteredTransactions.filter(tx => tx.date <= endDate);

    if (filteredTransactions.length === 0) {
      showToast('沒有符合條件的訂單', 'error');
      return;
    }

    const data = filteredTransactions.map(tx => {
      const itemsText = tx.items.map(item => `${item.name} x${item.qty}`).join(', ');
      return {
        '日期': tx.date,
        '發票編號': tx.invoiceNumber,
        '客戶姓名': tx.customerName || '-',
        '客戶電話': tx.customerPhone || '-',
        '商品明細': itemsText,
        '小計': tx.subtotal,
        '折扣': tx.discount,
        '總金額': tx.total,
        '支付方式': tx.paymentMethod
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "發票總表");

    const fileName = `發票總表_${startDate || '全部'}_至_${endDate || '全部'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`已成功匯出 ${filteredTransactions.length} 筆訂單`, 'success');
  };

  // ==================== 主畫面 ====================
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto" />
            <div>
              <div className="font-bold text-xl text-rose-700">{companyInfo.name}</div>
              <div className="text-xs text-rose-600 -mt-1">{companyInfo.english}</div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 border-t">
          <div className="flex gap-1">
            {[
              { key: 'sales', label: '銷售' },
              { key: 'inventory', label: '庫存' },
              { key: 'reports', label: '訂單記錄' },
              { key: 'customers', label: '客戶列表' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-rose-600 text-rose-600' : 'border-transparent hover:text-slate-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* 銷售頁面 */}
        {activeTab === 'sales' && (
          <div className="flex gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4">商品與服務</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                  <div key={item.id} onClick={() => addToCart(item)} className="bg-white border rounded-2xl p-4 cursor-pointer hover:border-rose-300 transition-all hover:shadow-sm">
                    <div className="font-semibold mb-1">{item.name}</div>
                    <div className="text-sm text-slate-500 mb-2">{item.category}</div>
                    <div className="text-2xl font-bold">HK${item.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-96 bg-white rounded-3xl border p-4 sticky top-20 h-fit shadow-sm">
              <div className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingCart className="text-rose-600" /> 購物車
              </div>

              {cart.length > 0 ? cart.map(item => (
                <div key={item.id} className="border rounded-xl p-3 mb-2">
                  <div className="flex justify-between text-sm">
                    <div>{item.name} × {item.qty}</div>
                    <div>HK$${(item.price * item.qty).toFixed(0)}</div>
                  </div>
                  {item.pickupDate && (
                    <div className="mt-2">
                      <div className="text-xs text-amber-600 mb-1">預計取貨日期</div>
                      <input type="date" value={item.pickupDate} onChange={e => updatePickupDate(item.id, e.target.value)} className="w-full text-xs border rounded px-2 py-1" />
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => updateCartQty(item.id, item.qty-1)} className="px-2 border rounded text-sm">-</button>
                    <button onClick={() => updateCartQty(item.id, item.qty+1)} className="px-2 border rounded text-sm">+</button>
                    <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-500 text-xs">移除</button>
                  </div>
                </div>
              )) : <p className="text-center text-slate-400 py-4">購物車是空的</p>}

              {cart.length > 0 && (
                <button onClick={openCheckout} className="mt-4 w-full bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition-colors">
                  結帳付款
                </button>
              )}
            </div>
          </div>
        )}

        {/* 庫存頁面 */}
        {activeTab === 'inventory' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">庫存管理</h2>
              <button onClick={openAddItemModal} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium">
                <Plus className="w-4 h-4" /> 添加商品 / 服務
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="pos-table w-full">
                <thead>
                  <tr>
                    <th>名稱</th>
                    <th>類型</th>
                    <th>類別</th>
                    <th className="text-right">單價</th>
                    <th className="text-right w-40">庫存 / 時長</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.name}</td>
                      <td>
                        <span className={`inline-block px-3 py-0.5 text-xs rounded-full ${item.type === 'product' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.type === 'product' ? '商品' : '服務'}
                        </span>
                      </td>
                      <td className="text-slate-500">{item.category}</td>
                      <td className="text-right font-mono">HK${item.price}</td>
                      <td className="text-right">
                        {item.type === 'product' ? <span className="font-mono">{item.stock}</span> : <span className="text-emerald-600 font-medium">{item.duration}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 訂單記錄頁面 */}
        {activeTab === 'reports' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">訂單記錄</h2>
              <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium">
                <FileDown className="w-4 h-4" /> 匯出 Excel
              </button>
            </div>

            {/* 日期篩選 */}
            <div className="bg-white rounded-2xl border p-4 mb-6 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">開始日期</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">結束日期</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
              </div>
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-4 py-2 text-sm border rounded-xl hover:bg-slate-50">清除篩選</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500">今日交易筆數</div>
                <div className="text-5xl font-semibold tabular-nums tracking-tighter mt-2">
                  {transactions.filter(tx => tx.date === new Date().toISOString().split('T')[0]).length}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500">今日營業額</div>
                <div className="text-5xl font-semibold tabular-nums tracking-tighter mt-2 text-emerald-600">
                  HK${transactions.filter(tx => tx.date === new Date().toISOString().split('T')[0]).reduce((sum, tx) => sum + tx.total, 0)}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500">累計訂單數</div>
                <div className="text-5xl font-semibold tabular-nums tracking-tighter mt-2">{transactions.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              {transactions.length > 0 ? (
                <table className="pos-table w-full">
                  <thead>
                    <tr>
                      <th>發票編號</th>
                      <th>日期 / 時間</th>
                      <th>顧客</th>
                      <th className="text-right">金額</th>
                      <th>支付方式</th>
                      <th className="text-center w-40">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(tx => {
                        if (startDate && tx.date < startDate) return false;
                        if (endDate && tx.date > endDate) return false;
                        return true;
                      })
                      .sort((a, b) => b.id - a.id)
                      .map(tx => (
                        <tr key={tx.id}>
                          <td className="font-mono text-sm font-semibold">{tx.invoiceNumber}</td>
                          <td className="text-sm text-slate-500">{tx.date} {tx.time}</td>
                          <td>{tx.customerName || '-'}</td>
                          <td className="text-right font-semibold">HK${tx.total}</td>
                          <td><span className="text-xs px-3 py-1 bg-slate-100 rounded-full">{tx.paymentMethod}</span></td>
                          <td className="text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => generateReceiptPDF(tx)} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg">Receipt</button>
                              <button onClick={() => generateInvoicePDF(tx)} className="text-xs px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg">Invoice</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-slate-400">尚無訂單記錄</div>
              )}
            </div>
          </div>
        )}

        {/* 客戶列表頁面 */}
        {activeTab === 'customers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">客戶列表</h2>
              <button onClick={openAddCustomerModal} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium">
                <Plus className="w-4 h-4" /> 新增客戶
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="搜尋客戶姓名或電話..." value={customerSearchTerm} onChange={(e) => setCustomerSearchTerm(e.target.value)} className="w-full pl-11 py-3 border border-slate-200 rounded-2xl focus:border-rose-400" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              {allCustomers.length > 0 ? (
                <table className="pos-table w-full">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>電話</th>
                      <th className="text-right">累計消費</th>
                      <th className="text-center">消費次數</th>
                      <th>最後消費</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCustomers
                      .filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.phone.includes(customerSearchTerm))
                      .map((customer, index) => {
                        const customerTx = transactions.filter(tx => 
                          (tx.customerName && tx.customerName === customer.name) || 
                          (tx.customerPhone && tx.customerPhone === customer.phone)
                        );
                        const totalSpent = customerTx.reduce((sum, tx) => sum + tx.total, 0);
                        return (
                          <tr key={index}>
                            <td className="font-medium">{customer.name}</td>
                            <td className="text-slate-500">{customer.phone || '-'}</td>
                            <td className="text-right font-semibold text-emerald-600">HK${totalSpent}</td>
                            <td className="text-center">{customerTx.length}</td>
                            <td className="text-sm text-slate-500">{customerTx.length > 0 ? customerTx.sort((a,b) => b.date.localeCompare(a.date))[0].date : '-'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-slate-400">尚無客戶資料</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 新增客戶 Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAddCustomerModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">新增客戶</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">客戶姓名 *</label>
                <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border p-3 rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">電話</label>
                <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full border p-3 rounded-xl mt-1" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsAddCustomerModalOpen(false)} className="flex-1 py-3 border rounded-xl">取消</button>
              <button onClick={handleAddCustomer} className="flex-1 py-3 bg-rose-600 text-white rounded-xl">確認新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 新增商品 Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAddItemModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">添加商品 / 服務</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">名稱</label>
                <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border p-3 rounded-xl mt-1" placeholder="例如：短直真髮假髮" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">類型</label>
                  <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="w-full border p-3 rounded-xl mt-1">
                    <option value="product">商品</option>
                    <option value="service">服務</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">價格</label>
                  <input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full border p-3 rounded-xl mt-1" placeholder="1280" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">類別</label>
                <input type="text" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full border p-3 rounded-xl mt-1" placeholder="假髮 / 洗護服務" />
              </div>
              {newItem.type === 'product' && (
                <div>
                  <label className="text-sm font-medium text-slate-600">初始庫存</label>
                  <input type="number" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} className="w-full border p-3 rounded-xl mt-1" placeholder="10" />
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" checked={newItem.requiresProcessing} onChange={e => setNewItem({...newItem, requiresProcessing: e.target.checked})} />
                <span className="text-sm">需要加工</span>
              </div>
              {newItem.requiresProcessing && (
                <div>
                  <label className="text-sm font-medium text-slate-600">加工天數</label>
                  <input type="number" value={newItem.defaultProcessingDays} onChange={e => setNewItem({...newItem, defaultProcessingDays: e.target.value})} className="w-full border p-3 rounded-xl mt-1" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsAddItemModalOpen(false)} className="flex-1 py-3 border rounded-xl">取消</button>
              <button onClick={handleAddItem} className="flex-1 py-3 bg-rose-600 text-white rounded-xl">確認新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 支付 Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closePaymentModal}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">確認付款</h2>
            <p className="text-4xl font-bold mb-6">HK${total}</p>
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600 block mb-2">所屬客戶（選填）</label>
              <div className="relative">
                <input type="text" value={customerSearchTerm} onChange={(e) => { setCustomerSearchTerm(e.target.value); setSelectedCustomerForCheckout(null); setShowCustomerSuggestions(true); }} onFocus={() => setShowCustomerSuggestions(true)} placeholder="輸入客戶姓名或電話..." className="w-full border p-3 rounded-xl focus:border-rose-400" />
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg max-h-48 overflow-auto">
                    {customerSuggestions.map((customer, index) => (
                      <div key={index} onClick={() => selectCustomer(customer)} className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b last:border-none">
                        <div className="font-medium">{customer.name}</div>
                        {customer.phone && <div className="text-xs text-slate-500">{customer.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomerForCheckout && <div className="mt-2 text-sm text-emerald-600">已選擇：{selectedCustomerForCheckout.name} {selectedCustomerForCheckout.phone && `(${selectedCustomerForCheckout.phone})`}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {paymentMethods.map(m => (
                <button key={m.id} onClick={() => setSelectedPayment(m.id)} className={`p-4 border rounded-2xl ${selectedPayment === m.id ? 'border-rose-600 bg-rose-50' : ''}`}>{m.label}</button>
              ))}
            </div>
            {selectedPayment === 'cash' && <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full border p-3 rounded-xl mb-4 text-2xl" placeholder="支付金額" />}
            <div className="flex gap-3">
              <button onClick={closePaymentModal} className="flex-1 py-3 border rounded-xl">取消</button>
              <button onClick={processCheckout} className="flex-1 py-3 bg-rose-600 text-white rounded-xl">確認交易</button>
            </div>
          </div>
        </div>
      )}

      {/* 成功 Modal */}
      {isSuccessModalOpen && lastTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeSuccessModal}>
          <div className="bg-white rounded-3xl w-full max-w-xl p-8" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">交易成功！</h2>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => printReceipt(lastTransaction)} className="flex-1 bg-slate-100 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">編印 Receipt</button>
              <button onClick={() => printInvoice(lastTransaction)} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-rose-700">編印 Invoice</button>
              <button onClick={() => sendToWhatsApp(lastTransaction)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700"><Send className="w-5 h-5" /> 發送至客戶 WhatsApp</button>
            </div>
            <button onClick={closeSuccessModal} className="mt-6 w-full py-3 border rounded-xl">關閉</button>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-2xl">{toast.message}</div>}
    </div>
  );
}

export default App;
