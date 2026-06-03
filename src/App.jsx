import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, BarChart3, Search, Plus, Minus, X, 
  CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle, Download, Send, FileDown, Calendar 
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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ==================== 預約功能 ====================
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddAppointmentModalOpen, setIsAddAppointmentModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    customerName: '', phone: '', date: '', time: '', notes: ''
  });
  const [isWhatsAppConfirmOpen, setIsWhatsAppConfirmOpen] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState(null);

  // localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem('pos_items');
    if (savedItems) setItems(JSON.parse(savedItems));
    const savedTransactions = localStorage.getItem('pos_transactions');
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    const savedCustomers = localStorage.getItem('pos_customers');
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    const savedAppointments = localStorage.getItem('pos_appointments');
    if (savedAppointments) setAppointments(JSON.parse(savedAppointments));
  }, []);

  useEffect(() => { localStorage.setItem('pos_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('pos_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('pos_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('pos_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('pos_appointments', JSON.stringify(appointments)); }, [appointments]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = Math.max(0, subtotal - discountAmount);

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    (categoryFilter === '全部' || item.category === categoryFilter))
    .sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name, 'zh-HK') : (a.type === 'product' ? -1 : 1));

  // 預約相關函數
  const getAppointmentsForDate = (date) => {
    return appointments.filter(a => a.date === date).sort((a, b) => a.time.localeCompare(b.time));
  };

  const hasTimeConflict = (date, time) => {
    return appointments.some(a => a.date === date && a.time === time);
  };

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return getAppointmentsForDate(today);
  };

  // 月曆
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        isCurrentMonth: true,
        dateStr,
        hasAppointment: appointments.some(a => a.date === dateStr)
      });
    }
    return days;
  };

  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const selectCalendarDate = (dateStr) => {
    setSelectedDate(dateStr);
  };

  // 新增預約
  const openAddAppointment = () => {
    setNewAppointment({
      customerName: '',
      phone: '',
      date: selectedDate,
      time: '10:00',
      notes: ''
    });
    setIsAddAppointmentModalOpen(true);
  };

  const handleAddAppointment = () => {
    if (!newAppointment.customerName || !newAppointment.phone || !newAppointment.time) {
      showToast('請填寫客戶姓名、電話與時間', 'error');
      return;
    }
    if (hasTimeConflict(newAppointment.date, newAppointment.time)) {
      showToast('此時段已被預約，請選擇其他時間', 'error');
      return;
    }

    const appointment = {
      id: Date.now(),
      ...newAppointment,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [...prev, appointment]);
    setIsAddAppointmentModalOpen(false);
    setPendingAppointment(appointment);
    setIsWhatsAppConfirmOpen(true);
    showToast('預約已成功新增', 'success');
  };

  const sendWhatsAppConfirmation = (appointment) => {
    const message = `你好，${appointment.customerName}\n\n感謝你聯絡 Beauti Hair Centre，我們已為你預約：\n日期：${appointment.date}\n時間：${appointment.time}\n\n如需更改時間，歡迎隨時聯絡我們。\n期待為你服務！\n\n麗明珠真髮中心\nTel: ${companyInfo.phone}\nWhatsApp: ${companyInfo.whatsapp}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = appointment.phone 
      ? `https://wa.me/${appointment.phone.replace(/\s/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setIsWhatsAppConfirmOpen(false);
    setPendingAppointment(null);
  };

  const skipWhatsApp = () => {
    setIsWhatsAppConfirmOpen(false);
    setPendingAppointment(null);
  };

  const updateAppointmentStatus = (id, newStatus) => {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
    );
  };

  const deleteAppointment = (id) => {
    if (window.confirm('確定要刪除此預約嗎？')) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      showToast('預約已刪除', 'success');
    }
  };

  // ==================== 其他原有函數 ====================
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

  const showToastMessage = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };
  const printReceipt = (transaction) => {
    if (!transaction) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('請允許彈出視窗使用列印功能');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${transaction.invoiceNumber}</title>
          <style>
            @media print { @page { size: A5 portrait; margin: 8mm; } }
            body { font-family: "Noto Sans TC", "PingFang TC", system-ui, sans-serif; padding: 10mm; line-height: 1.55; font-size: 11px; color: #374151; }
            .header { text-align: center; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
            th, td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
            th { background: #f8fafc; font-weight: 600; }
            .total { text-align: right; font-size: 12px; }
            .thankyou { text-align: right; font-size: 12px; color: #6b7280; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" style="height:120px; margin-bottom:8px;" />
            <div style="font-size:20px; font-weight:700;">RECEIPT</div>
            <div style="font-size:13px; color:#6b7280;">麗明珠真髮中心</div>
          </div>

          <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:10.5px;">
            <div>
              <strong style="font-size:9.5px; color:#6b7280;">BILLED TO</strong><br>
              ${transaction.customerName || '客戶'}<br>
              ${transaction.customerPhone || ''}
            </div>
            <div style="text-align:right;">
              <strong style="font-size:9.5px; color:#6b7280;">RECEIPT NO</strong><br>
              ${transaction.invoiceNumber}<br>
              <strong style="font-size:9.5px; color:#6b7280;">DATE</strong><br>
              ${transaction.date} ${transaction.time}
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
                ${item.pickupDate ? `<tr><td colspan="4" style="font-size:9.5px;">→ 取貨日期：${item.pickupDate}</td></tr>` : ''}
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            小計：HK$${transaction.subtotal}<br>
            ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
            <strong style="font-size:14px;">總金額：HK$${transaction.total}</strong><br>
            支付方式：${transaction.paymentMethod}
          </div>

          <div class="thankyou">Thank you for your business!</div>
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
            body { font-family: "Noto Sans TC", "PingFang TC", system-ui, sans-serif; padding: 8mm; line-height: 1.55; font-size: 11px; color: #374151; }
            .header { text-align: center; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
            th, td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
            th { background: #f8fafc; font-weight: 600; }
            .total { text-align: right; font-size: 11px; }
            .thankyou { text-align: right; font-size: 12px; color: #6b7280; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" style="height:145px; margin-bottom:8px;" />
            <div style="font-size:22px; font-weight:700;">INVOICE</div>
            <div style="font-size:13px; color:#6b7280;">麗明珠真髮中心</div>
          </div>

          <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:10.5px;">
            <div>
              <strong style="font-size:9.5px; color:#6b7280;">BILLED TO</strong><br>
              ${transaction.customerName || '客戶'}<br>
              ${transaction.customerPhone || ''}
            </div>
            <div style="text-align:right;">
              <strong style="font-size:9.5px; color:#6b7280;">INVOICE NO</strong><br>
              ${transaction.invoiceNumber}<br>
              <strong style="font-size:9.5px; color:#6b7280;">DATE</strong><br>
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
                ${item.pickupDate ? `<tr><td colspan="4" style="font-size:9.5px;">→ 取貨日期：${item.pickupDate}</td></tr>` : ''}
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            小計：HK$${transaction.subtotal}<br>
            ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
            <strong style="font-size:14px;">總金額：HK$${transaction.total}</strong><br>
            支付方式：${transaction.paymentMethod}
          </div>

          <div class="thankyou">Thank you for your business!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const sendToWhatsApp = (transaction) => {
    if (!transaction) return;
    const phone = transaction.customerPhone ? transaction.customerPhone.replace(/\s/g, '') : '';
    const hasPickup = transaction.items.some(i => i.pickupDate);

    const message = `麗明珠真髮中心 訂單確認\n\n訂單編號：${transaction.invoiceNumber}\n客戶：${transaction.customerName || '尊貴客戶'}\n總金額：HK$${transaction.total}\n支付方式：${transaction.paymentMethod}\n${hasPickup ? `取貨日期：${transaction.items.find(i => i.pickupDate)?.pickupDate}\n` : ''}請查看附件發票。\n\n${companyInfo.name}\nTel: ${companyInfo.phone} ｜ WhatsApp: ${companyInfo.whatsapp}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateReceiptPDF = async (transaction) => {
    const margin = 6;
    const pageWidth = 148;
    const contentWidth = pageWidth - (margin * 2);

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = `${contentWidth}mm`;
    tempDiv.style.padding = '6mm';
    tempDiv.style.background = '#ffffff';
    tempDiv.style.border = '1px solid #d1d5db';
    tempDiv.style.borderRadius = '3px';
    tempDiv.style.fontFamily = '"Noto Sans TC", "PingFang TC", system-ui, sans-serif';
    tempDiv.style.fontSize = '11px';
    tempDiv.style.lineHeight = '1.5';
    tempDiv.style.color = '#374151';

    tempDiv.innerHTML = `
      <div style="text-align:center; margin-bottom:8px">
        <img src="/logo.png" style="height:120px; margin-bottom:8px; display:block; margin-left:auto; margin-right:auto;" />
        <div style="font-size:20px; font-weight:700;">RECEIPT</div>
        <div style="font-size:13px; color:#6b7280;">麗明珠真髮中心</div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:10.5px;">
        <div>
          <strong style="font-size:9.5px; color:#6b7280;">BILLED TO</strong><br>
          ${transaction.customerName || '客戶'}<br>
          ${transaction.customerPhone || ''}
        </div>
        <div style="text-align:right;">
          <strong style="font-size:9.5px; color:#6b7280;">RECEIPT NO</strong><br>
          ${transaction.invoiceNumber}<br>
          <strong style="font-size:9.5px; color:#6b7280;">DATE</strong><br>
          ${transaction.date} ${transaction.time}
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:10.5px;">
        <thead>
          <tr style="background:#f8fafc; border-bottom:1px solid #e5e7eb;">
            <th style="padding:7px 8px; text-align:left; font-weight:600;">項目</th>
            <th style="padding:7px 8px; text-align:center; width:9%;">數量</th>
            <th style="padding:7px 8px; text-align:right; width:14%;">單價</th>
            <th style="padding:7px 8px; text-align:right; width:14%;">小計</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.items.map(item => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:7px 8px;">${item.name}</td>
              <td style="padding:7px 8px; text-align:center;">${item.qty}</td>
              <td style="padding:7px 8px; text-align:right;">HK$${item.price}</td>
              <td style="padding:7px 8px; text-align:right;">HK$${(item.price * item.qty).toFixed(0)}</td>
            </tr>
            ${item.pickupDate ? `<tr><td colspan="4" style="padding:3px 8px; font-size:9.5px;">→ 取貨日期：${item.pickupDate}</td></tr>` : ''}
          `).join('')}
        </tbody>
      </table>

      <div style="text-align:right; font-size:11px; margin-bottom:12px;">
        小計：HK$${transaction.subtotal}<br>
        ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
        <strong style="font-size:14px;">總金額：HK$${transaction.total}</strong><br>
        支付方式：${transaction.paymentMethod}
      </div>

      <div style="text-align:right; font-size:12px; color:#6b7280; margin-top:10px;">
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
    pdf.save(`Receipt_${transaction.invoiceNumber}_A5.pdf`);

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
    tempDiv.style.padding = '6mm';
    tempDiv.style.background = '#ffffff';
    tempDiv.style.border = '1px solid #d1d5db';
    tempDiv.style.borderRadius = '3px';
    tempDiv.style.fontFamily = '"Noto Sans TC", "PingFang TC", system-ui, sans-serif';
    tempDiv.style.fontSize = '11px';
    tempDiv.style.lineHeight = '1.5';
    tempDiv.style.color = '#374151';

    tempDiv.innerHTML = `
      <div style="text-align:center; margin-bottom:8px">
        <img src="/logo.png" style="height:155px; margin-bottom:8px; display:block; margin-left:auto; margin-right:auto;" />
        <div style="font-size:22px; font-weight:700;">INVOICE</div>
        <div style="font-size:13px; color:#6b7280; margin-top:2px;">麗明珠真髮中心</div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:10.5px;">
        <div>
          <strong style="font-size:9.5px; color:#6b7280;">BILLED TO</strong><br>
          ${transaction.customerName || '客戶'}<br>
          ${transaction.customerPhone || ''}
        </div>
        <div style="text-align:right;">
          <strong style="font-size:9.5px; color:#6b7280;">INVOICE NO</strong><br>
          ${transaction.invoiceNumber}<br>
          <strong style="font-size:9.5px; color:#6b7280;">DATE</strong><br>
          ${transaction.date}
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:10.5px;">
        <thead>
          <tr style="background:#f8fafc; border-bottom:1px solid #e5e7eb;">
            <th style="padding:7px 8px; text-align:left; font-weight:600;">項目</th>
            <th style="padding:7px 8px; text-align:center; width:9%;">數量</th>
            <th style="padding:7px 8px; text-align:right; width:14%;">單價</th>
            <th style="padding:7px 8px; text-align:right; width:14%;">小計</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.items.map(item => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:7px 8px;">${item.name}</td>
              <td style="padding:7px 8px; text-align:center;">${item.qty}</td>
              <td style="padding:7px 8px; text-align:right;">HK$${item.price}</td>
              <td style="padding:7px 8px; text-align:right;">HK$${(item.price * item.qty).toFixed(0)}</td>
            </tr>
            ${item.pickupDate ? `<tr><td colspan="4" style="padding:3px 8px; font-size:9.5px;">→ 取貨日期：${item.pickupDate}</td></tr>` : ''}
          `).join('')}
        </tbody>
      </table>

      <div style="text-align:right; font-size:11px; margin-bottom:12px;">
        小計：HK$${transaction.subtotal}<br>
        ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
        <span style="font-size:14px; font-weight:700;">總金額：HK$${transaction.total}</span><br>
        <span style="font-size:10px;">支付方式：${transaction.paymentMethod}</span>
      </div>

      <div style="text-align:right; font-size:12px; color:#6b7280; margin-top:10px;">
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

  // ==================== 主畫面 JSX ====================
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
              { key: 'appointments', label: '預約' },
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

              {/* 今日預約摘要 */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">今日預約</h3>
                  <button onClick={() => setActiveTab('appointments')} className="text-sm text-rose-600 hover:underline">查看全部 →</button>
                </div>
                <div className="bg-white border rounded-2xl p-4">
                  {getTodayAppointments().length > 0 ? (
                    getTodayAppointments().map((apt, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl mb-2 last:mb-0">
                        <div>
                          <span className="font-medium">{apt.customerName}</span>
                          <span className="text-slate-500 ml-2">({apt.time})</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">{apt.status}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-4">今日暫無預約</p>
                  )}
                </div>
              </div>
            </div>

            {/* 購物車 */}
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

        {/* 預約頁面 */}
        {activeTab === 'appointments' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">預約管理</h2>
              <button onClick={openAddAppointment} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium">
                <Plus className="w-4 h-4" /> 新增預約
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 月曆 */}
              <div className="lg:col-span-2 bg-white rounded-3xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => changeMonth(-1)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">◀ 上個月</button>
                  <div className="font-semibold text-lg">
                    {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
                  </div>
                  <button onClick={() => changeMonth(1)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">下個月 ▶</button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="font-medium text-slate-500 py-2">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => (
                    <div key={index} onClick={() => day.dateStr && selectCalendarDate(day.dateStr)}
                      className={`min-h-[60px] p-2 border rounded-xl text-sm cursor-pointer transition-all
                        ${day.isCurrentMonth ? 'bg-white hover:bg-rose-50' : 'bg-slate-100 text-slate-400'}
                        ${selectedDate === day.dateStr ? 'ring-2 ring-rose-500' : ''}
                      `}>
                      {day.day && (
                        <div>
                          <div className="font-medium">{day.day}</div>
                          {day.hasAppointment && <div className="w-2 h-2 bg-rose-500 rounded-full mx-auto mt-1"></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 選定日期預約列表 */}
              <div className="bg-white rounded-3xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{selectedDate} 預約</h3>
                  <button onClick={openAddAppointment} className="text-sm text-rose-600">+ 新增</button>
                </div>

                {getAppointmentsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getAppointmentsForDate(selectedDate).map(apt => (
                      <div key={apt.id} className="border rounded-2xl p-4">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{apt.customerName}</div>
                            <div className="text-sm text-slate-500">{apt.time} ｜ {apt.phone}</div>
                          </div>
                          <select value={apt.status} onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)} className="text-xs border rounded px-2">
                            <option value="pending">待確認</option>
                            <option value="confirmed">已確認</option>
                            <option value="completed">已完成</option>
                            <option value="cancelled">已取消</option>
                          </select>
                        </div>
                        {apt.notes && <div className="text-xs text-slate-500 mt-1">{apt.notes}</div>}
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => deleteAppointment(apt.id)} className="text-xs text-red-500">刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">此日期尚無預約</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增預約 Modal */}
      {isAddAppointmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAddAppointmentModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">新增預約</h2>
            <div className="space-y-4">
              <input type="text" placeholder="客戶稱呼" value={newAppointment.customerName} onChange={e => setNewAppointment({...newAppointment, customerName: e.target.value})} className="w-full border p-3 rounded-xl" />
              <input type="text" placeholder="電話" value={newAppointment.phone} onChange={e => setNewAppointment({...newAppointment, phone: e.target.value})} className="w-full border p-3 rounded-xl" />
              <input type="date" value={newAppointment.date} onChange={e => setNewAppointment({...newAppointment, date: e.target.value})} className="w-full border p-3 rounded-xl" />
              <select value={newAppointment.time} onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} className="w-full border p-3 rounded-xl">
                {Array.from({ length: 21 }, (_, i) => {
                  const hour = 10 + Math.floor(i / 2);
                  const min = i % 2 === 0 ? '00' : '30';
                  return `${hour}:${min}`;
                }).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea placeholder="備註（選填）" value={newAppointment.notes} onChange={e => setNewAppointment({...newAppointment, notes: e.target.value})} className="w-full border p-3 rounded-xl" rows="2" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAddAppointmentModalOpen(false)} className="flex-1 py-3 border rounded-xl">取消</button>
              <button onClick={handleAddAppointment} className="flex-1 py-3 bg-rose-600 text-white rounded-xl">確認預約</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp 確認 Modal */}
      {isWhatsAppConfirmOpen && pendingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">是否發送 WhatsApp 確認訊息？</h3>
            <p className="text-slate-600 mb-6">預約已成功新增，是否立即發送確認訊息給客戶？</p>
            <div className="flex gap-3">
              <button onClick={skipWhatsApp} className="flex-1 py-3 border rounded-xl">不用發送</button>
              <button onClick={() => sendWhatsAppConfirmation(pendingAppointment)} className="flex-1 py-3 bg-green-600 text-white rounded-xl">發送確認訊息</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-2xl">{toast.message}</div>}
    </div>
  );
}

export default App;
