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
  { id: 1, name: "優質短直真髮假髮 (自然黑)", price: 1280, type: "product", stock: 8, category: "假髮", hasVariants: false, variants: [], isPopular: true },
  { id: 2, name: "長捲真髮假髮 (棕色)", price: 1680, type: "product", stock: 5, category: "假髮", hasVariants: false, variants: [], isPopular: false },
  { id: 3, name: "高級真髮假髮護理套裝", price: 380, type: "product", stock: 22, category: "假髮用品", hasVariants: false, variants: [], isPopular: true },
  { id: 4, name: "假髮專用清潔噴霧 (250ml)", price: 128, type: "product", stock: 35, category: "假髮用品", hasVariants: false, variants: [], isPopular: false },
  { id: 5, name: "真髮假髮洗護造型服務", price: 450, type: "service", stock: null, duration: "約3-5天加工", category: "洗護服務", hasVariants: false, variants: [], isPopular: true },
  { id: 6, name: "假髮專業染色服務", price: 680, type: "service", stock: null, duration: "約5天加工", category: "洗護服務", hasVariants: true, variants: [
    { id: 1, name: "紅色", price: 90 },
    { id: 2, name: "黃色", price: 100 },
    { id: 3, name: "黑色", price: 120 }
  ], isPopular: false },
  { id: 7, name: "假髮修剪調整服務", price: 280, type: "service", stock: null, duration: "即日可取", category: "洗護服務", hasVariants: false, variants: [], isPopular: true },
  { id: 8, name: "真髮假髮深層護理套餐", price: 880, type: "service", stock: null, duration: "約4天加工", category: "洗護服務", hasVariants: false, variants: [], isPopular: false },
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
    name: '', price: '', type: 'product', category: '', hasVariants: false, variants: [], stock: '', isPopular: false
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 預約功能
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddAppointmentModalOpen, setIsAddAppointmentModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    customerName: '', phone: '', date: '', time: '', notes: ''
  });
  const [isWhatsAppConfirmOpen, setIsWhatsAppConfirmOpen] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState(null);

  // 新增狀態
  const [pickupDate, setPickupDate] = useState('');
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState(null);

  // 變體選擇
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState(null);

  // 折扣與調整
  const [discountAmount, setDiscountAmount] = useState(0);
  const [adjustment, setAdjustment] = useState(0);

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

  const subtotal = cart.reduce((sum, item) => {
    const price = item.selectedVariant ? item.selectedVariant.price : item.price;
    return sum + price * item.qty;
  }, 0);

  const finalTotal = subtotal - discountAmount + adjustment;

  // 排序：常用項目排前面
  const sortedItems = [...items].sort((a, b) => {
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    return 0;
  });

  const filteredItems = sortedItems
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    (categoryFilter === '全部' || item.category === categoryFilter));

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
      hasVariants: false,
      variants: [],
      stock: '',
      isPopular: false
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
      hasVariants: newItem.hasVariants,
      variants: newItem.hasVariants ? newItem.variants : [],
      stock: newItem.type === 'product' ? (parseInt(newItem.stock) || 0) : null,
      duration: newItem.type === 'service' ? '約3-5天加工' : null,
      isPopular: newItem.isPopular
    };

    setItems(prev => [...prev, newProduct]);
    setIsAddItemModalOpen(false);
    showToast('商品/服務已成功新增！', 'success');
  };

  const openEditItemModal = (item) => {
    setEditingItem({ 
      ...item,
      variants: item.variants || []
    });
    setIsEditItemModalOpen(true);
  };

  const handleEditItem = () => {
    if (!editingItem.name || !editingItem.price || !editingItem.category) {
      showToast('請填寫名稱、價格與類別', 'error');
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.id === editingItem.id ? { 
          ...editingItem,
          variants: editingItem.hasVariants ? editingItem.variants : []
        } : item
      )
    );

    setIsEditItemModalOpen(false);
    setEditingItem(null);
    showToast('商品/服務已更新！', 'success');
  };

  const deleteItem = (id) => {
    if (window.confirm('確定要刪除此商品/服務嗎？')) {
      setItems(prev => prev.filter(item => item.id !== id));
      showToast('商品/服務已刪除', 'success');
    }
  };

  // 加入購物車（含變體處理）
  const addToCart = (item) => {
    if (item.hasVariants && item.variants && item.variants.length > 0) {
      setSelectedItemForVariant(item);
      setIsVariantModalOpen(true);
    } else {
      if (item.type === 'product' && item.stock !== null) {
        const inCart = cart.find(c => c.id === item.id);
        if ((inCart ? inCart.qty : 0) + 1 > item.stock) {
          showToast('庫存不足！', 'error');
          return;
        }
      }
      setCart(prev => [...prev, { ...item, qty: 1, selectedVariant: null }]);
      showToast(`${item.name} 已加入購物車`, 'success');
    }
  };

  const confirmVariantAndAddToCart = (variant) => {
    const item = selectedItemForVariant;
    if (!item) return;

    if (item.type === 'product' && item.stock !== null) {
      const inCart = cart.find(c => c.id === item.id && c.selectedVariant?.id === variant.id);
      if ((inCart ? inCart.qty : 0) + 1 > item.stock) {
        showToast('庫存不足！', 'error');
        setIsVariantModalOpen(false);
        setSelectedItemForVariant(null);
        return;
      }
    }

    const cartItem = {
      ...item,
      qty: 1,
      selectedVariant: variant
    };

    setCart(prev => [...prev, cartItem]);
    showToast(`${item.name} - ${variant.name} 已加入購物車`, 'success');
    
    setIsVariantModalOpen(false);
    setSelectedItemForVariant(null);
  };

  const updateCartQty = (index, newQty) => {
    if (newQty < 1) return;
    const item = cart[index];
    if (item.type === 'product' && item.stock !== null && newQty > item.stock) {
      showToast('超過可用庫存', 'error');
      return;
    }
    setCart(prev => prev.map((item, i) => i === index ? { ...item, qty: newQty } : item));
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => { 
    setCart([]); 
    setDiscountPercent(0); 
    setPickupDate(''); 
    setDiscountAmount(0);
    setAdjustment(0);
  };

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
    const generateInvoicePDF = async (transaction) => {
    const margin = 4;
    const pageWidth = 148;
    const contentWidth = pageWidth - (margin * 2);

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = `${contentWidth}mm`;
    tempDiv.style.padding = '4mm 5mm';
    tempDiv.style.background = '#ffffff';
    tempDiv.style.fontFamily = '"Noto Sans TC", "PingFang TC", system-ui, sans-serif';
    tempDiv.style.fontSize = '11px';
    tempDiv.style.lineHeight = '1.45';
    tempDiv.style.color = '#374151';

    let itemsHTML = '';
    transaction.items.forEach(item => {
      const displayName = item.selectedVariant 
        ? `${item.name} - ${item.selectedVariant.name}` 
        : item.name;
      const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;
      itemsHTML += `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:6px 6px;">${displayName}</td>
          <td style="padding:6px 6px; text-align:center;">${item.qty}</td>
          <td style="padding:6px 6px; text-align:right;">HK$${itemPrice}</td>
          <td style="padding:6px 6px; text-align:right;">HK$${(itemPrice * item.qty).toFixed(0)}</td>
        </tr>
      `;
    });

    tempDiv.innerHTML = `
      <div style="text-align:center; margin-bottom:4px">
        <img src="/logo.png" style="height:135px; margin-bottom:2px; display:block; margin-left:auto; margin-right:auto;" />
        <div style="font-size:21px; font-weight:700;">INVOICE</div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:10px;">
        <div>
          <strong style="font-size:9px; color:#6b7280;">BILLED TO</strong><br>
          ${transaction.customerName || '客戶'}<br>
          ${transaction.customerPhone || ''}
        </div>
        <div style="text-align:right;">
          <strong style="font-size:9px; color:#6b7280;">INVOICE NO</strong><br>
          ${transaction.invoiceNumber}<br>
          <strong style="font-size:9px; color:#6b7280;">DATE</strong><br>
          ${transaction.date}
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:10.5px;">
        <thead>
          <tr style="background:#f8fafc; border-bottom:1px solid #e5e7eb;">
            <th style="padding:6px 6px; text-align:left; font-weight:600;">項目</th>
            <th style="padding:6px 6px; text-align:center; width:9%;">數量</th>
            <th style="padding:6px 6px; text-align:right; width:14%;">單價</th>
            <th style="padding:6px 6px; text-align:right; width:14%;">小計</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- 總金額區域（已移除小計 + 對齊統一） -->
      <div style="text-align:right; font-size:11px; margin-bottom:8px; line-height:1.6;">
        <div>總金額：               HK$${transaction.total}</div>
        <div>支付方式：             ${transaction.paymentMethod}</div>
        ${transaction.pickupDate ? `<div>→ 預計取貨日期：       ${transaction.pickupDate}</div>` : ''}
        ${transaction.discount > 0 ? `<div>折扣：                 -HK$${transaction.discount}</div>` : ''}
      </div>

      <!-- 條款區域（增加上方空白） -->
      <div style="margin-top:28px; padding-top:8px; border-top:1px solid #e5e7eb; font-size:8.5px; line-height:1.35; color:#4b5563;">
        <strong style="font-size:9px;">取貨期限 / Collection Period</strong><br>
        Please collect your goods within three months from the order date. Uncollected items after this period will be void.<br>
        請於本訂單日期起三個月內憑單取回假髮；逾期未取者，該物品視作作廢。<br><br>

        <strong style="font-size:9px;">自然磨損及褪色 / Natural Wear and Tear</strong><br>
        The company is not responsible for colour changes or other damage resulting from normal wear and tear or natural ageing of the hair.<br>
        因日常使用或頭髮自然老化而引致的變色或損壞，本公司恕不負責。<br><br>

        <strong style="font-size:9px;">清洗處理及天災責任 / Cleaning and Force Majeure</strong><br>
        We will handle wigs with care during cleaning. However, the company is not liable for damage or loss caused by natural disasters or other events beyond our control.<br>
        本公司在為客人清洗假髮時會小心處理；但若因天災或其他不可抗力之事由導致損壞或遺失，本公司概不負責。
      </div>

      <div style="text-align:right; font-size:11px; color:#6b7280; margin-top:8px;">
        Thank you for your business!
      </div>
    `;

    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, { scale: 3.5, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: [148, 210] 
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth - (margin * 2), pdfHeight);
    pdf.save(`Invoice_${transaction.invoiceNumber}_A5.pdf`);

    document.body.removeChild(tempDiv);
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
    setSelectedPayment('cash');
    setPaidAmount(finalTotal.toString());
    setCheckoutError('');
    setCustomerSearchTerm('');
    setSelectedCustomerForCheckout(null);
    setShowCustomerSuggestions(false);
    setPickupDate('');
    setDiscountAmount(0);
    setAdjustment(0);
    setIsPaymentModalOpen(true);
  };

  const processCheckout = () => {
    let change = 0;
    const paid = parseFloat(paidAmount) || 0;
    if (selectedPayment === 'cash' && paid < finalTotal) {
      setCheckoutError('支付金額不足');
      return;
    }
    if (selectedPayment === 'cash') change = paid - finalTotal;

    const invoiceNumber = generateInvoiceNumber();

    const newTransaction = {
      id: Date.now(),
      invoiceNumber,
      time: new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      items: [...cart],
      subtotal, 
      discount: discountAmount,
      adjustment: adjustment,
      total: finalTotal,
      paymentMethod: paymentMethods.find(m => m.id === selectedPayment)?.label,
      change,
      customerName: selectedCustomerForCheckout?.name || customerSearchTerm || null,
      customerPhone: selectedCustomerForCheckout?.phone || null,
      pickupDate: pickupDate || null,
      company: companyInfo
    };

    const updatedItems = items.map(item => {
      const cartItems = cart.filter(c => c.id === item.id);
      if (cartItems.length > 0 && item.type === 'product' && item.stock !== null) {
        const totalQty = cartItems.reduce((sum, c) => sum + c.qty, 0);
        return { ...item, stock: Math.max(0, item.stock - totalQty) };
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
            .terms { margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 8.5px; line-height: 1.4; color: #4b5563; }
            .thankyou { text-align: right; font-size: 12px; color: #6b7280; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" style="height:120px; margin-bottom:6px;" />
            <div style="font-size:20px; font-weight:700;">RECEIPT</div>
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
              ${transaction.items.map(item => {
                const displayName = item.selectedVariant 
                  ? `${item.name} - ${item.selectedVariant.name}` 
                  : item.name;
                const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;
                return `
                  <tr>
                    <td>${displayName}</td>
                    <td style="text-align:center;">${item.qty}</td>
                    <td style="text-align:right;">HK$${itemPrice}</td>
                    <td style="text-align:right;">HK$${(itemPrice * item.qty).toFixed(0)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="total">
            小計：HK$${transaction.subtotal}<br>
            ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
            <strong style="font-size:14px;">總金額：HK$${transaction.total}</strong><br>
            支付方式：${transaction.paymentMethod}
            ${transaction.pickupDate ? `<br>→ 預計取貨日期：${transaction.pickupDate}` : ''}
          </div>

          <!-- 條款區域 -->
          <div class="terms">
            <strong style="font-size:9px;">取貨期限 / Collection Period</strong><br>
            Please collect your goods within three months from the order date. Uncollected items after this period will be void.<br>
            請於本訂單日期起三個月內憑單取回假髮；逾期未取者，該物品視作作廢。<br><br>

            <strong style="font-size:9px;">自然磨損及褪色 / Natural Wear and Tear</strong><br>
            The company is not responsible for colour changes or other damage resulting from normal wear and tear or natural ageing of the hair.<br>
            因日常使用或頭髮自然老化而引致的變色或損壞，本公司恕不負責。<br><br>

            <strong style="font-size:9px;">清洗處理及天災責任 / Cleaning and Force Majeure</strong><br>
            We will handle wigs with care during cleaning. However, the company is not liable for damage or loss caused by natural disasters or other events beyond our control.<br>
            本公司在為客人清洗假髮時會小心處理；但若因天災或其他不可抗力之事由導致損壞或遺失，本公司概不負責。
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
            body { font-family: "Noto Sans TC", "PingFang TC", system-ui, sans-serif; padding: 8mm; line-height: 1.55; font-size: 11px; color: #374151; }
            .header { text-align: center; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
            th, td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
            th { background: #f8fafc; font-weight: 600; }
            .total { text-align: right; font-size: 11px; }
            .terms { margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 8.5px; line-height: 1.4; color: #4b5563; }
            .thankyou { text-align: right; font-size: 12px; color: #6b7280; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" style="height:145px; margin-bottom:6px;" />
            <div style="font-size:22px; font-weight:700;">INVOICE</div>
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
              ${transaction.items.map(item => {
                const displayName = item.selectedVariant 
                  ? `${item.name} - ${item.selectedVariant.name}` 
                  : item.name;
                const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;
                return `
                  <tr>
                    <td>${displayName}</td>
                    <td style="text-align:center;">${item.qty}</td>
                    <td style="text-align:right;">HK$${itemPrice}</td>
                    <td style="text-align:right;">HK$${(itemPrice * item.qty).toFixed(0)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="total">
            小計：HK$${transaction.subtotal}<br>
            ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
            <strong style="font-size:14px;">總金額：HK$${transaction.total}</strong><br>
            支付方式：${transaction.paymentMethod}
            ${transaction.pickupDate ? `<br>→ 預計取貨日期：${transaction.pickupDate}` : ''}
          </div>

          <!-- 條款區域 -->
          <div class="terms">
            <strong style="font-size:9px;">取貨期限 / Collection Period</strong><br>
            Please collect your goods within three months from the order date. Uncollected items after this period will be void.<br>
            請於本訂單日期起三個月內憑單取回假髮；逾期未取者，該物品視作作廢。<br><br>

            <strong style="font-size:9px;">自然磨損及褪色 / Natural Wear and Tear</strong><br>
            The company is not responsible for colour changes or other damage resulting from normal wear and tear or natural ageing of the hair.<br>
            因日常使用或頭髮自然老化而引致的變色或損壞，本公司恕不負責。<br><br>

            <strong style="font-size:9px;">清洗處理及天災責任 / Cleaning and Force Majeure</strong><br>
            We will handle wigs with care during cleaning. However, the company is not liable for damage or loss caused by natural disasters or other events beyond our control.<br>
            本公司在為客人清洗假髮時會小心處理；但若因天災或其他不可抗力之事由導致損壞或遺失，本公司概不負責。
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const sendToWhatsApp = (transaction) => {
    if (!transaction) return;
    const phone = transaction.customerPhone ? transaction.customerPhone.replace(/\s/g, '') : '';
    const hasPickup = transaction.pickupDate;

    const message = `麗明珠真髮中心 訂單確認\n\n訂單編號：${transaction.invoiceNumber}\n客戶：${transaction.customerName || '尊貴客戶'}\n總金額：HK$${transaction.total}\n支付方式：${transaction.paymentMethod}\n${hasPickup ? `預計取貨日期：${transaction.pickupDate}\n` : ''}請查看附件發票。\n\n${companyInfo.name}\nTel: ${companyInfo.phone} ｜ WhatsApp: ${companyInfo.whatsapp}`;

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

    let itemsHTML = '';
    transaction.items.forEach(item => {
      const displayName = item.selectedVariant 
        ? `${item.name} - ${item.selectedVariant.name}` 
        : item.name;
      const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;
      itemsHTML += `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:7px 8px;">${displayName}</td>
          <td style="padding:7px 8px; text-align:center;">${item.qty}</td>
          <td style="padding:7px 8px; text-align:right;">HK$${itemPrice}</td>
          <td style="padding:7px 8px; text-align:right;">HK$${(itemPrice * item.qty).toFixed(0)}</td>
        </tr>
      `;
    });

    tempDiv.innerHTML = `
      <div style="text-align:center; margin-bottom:8px">
        <img src="/logo.png" style="height:120px; margin-bottom:6px; display:block; margin-left:auto; margin-right:auto;" />
        <div style="font-size:20px; font-weight:700;">RECEIPT</div>
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
          ${itemsHTML}
        </tbody>
      </table>

      <div style="text-align:right; font-size:11px; margin-bottom:12px;">
        小計：HK$${transaction.subtotal}<br>
        ${transaction.discount > 0 ? `折扣：-HK$${transaction.discount}<br>` : ''}
        <strong style="font-size:14px;">總金額：HK$${transaction.total}</strong><br>
        支付方式：${transaction.paymentMethod}
        ${transaction.pickupDate ? `<br>→ 預計取貨日期：${transaction.pickupDate}` : ''}
      </div>

      <!-- 條款區域 -->
      <div style="margin-top:12px; padding-top:8px; border-top:1px solid #e5e7eb; font-size:8.5px; line-height:1.4; color:#4b5563;">
        <strong style="font-size:9px;">取貨期限 / Collection Period</strong><br>
        Please collect your goods within three months from the order date. Uncollected items after this period will be void.<br>
        請於本訂單日期起三個月內憑單取回假髮；逾期未取者，該物品視作作廢。<br><br>

        <strong style="font-size:9px;">自然磨損及褪色 / Natural Wear and Tear</strong><br>
        The company is not responsible for colour changes or other damage resulting from normal wear and tear or natural ageing of the hair.<br>
        因日常使用或頭髮自然老化而引致的變色或損壞，本公司恕不負責。<br><br>

        <strong style="font-size:9px;">清洗處理及天災責任 / Cleaning and Force Majeure</strong><br>
        We will handle wigs with care during cleaning. However, the company is not liable for damage or loss caused by natural disasters or other events beyond our control.<br>
        本公司在為客人清洗假髮時會小心處理；但若因天災或其他不可抗力之事由導致損壞或遺失，本公司概不負責。
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

  const exportToExcel = () => {
    let filteredTransactions = [...transactions];
    if (startDate) filteredTransactions = filteredTransactions.filter(tx => tx.date >= startDate);
    if (endDate) filteredTransactions = filteredTransactions.filter(tx => tx.date <= endDate);

    if (filteredTransactions.length === 0) {
      showToast('沒有符合條件的訂單', 'error');
      return;
    }

    const data = filteredTransactions.map(tx => {
      const itemsText = tx.items.map(item => {
        const displayName = item.selectedVariant 
          ? `${item.name} - ${item.selectedVariant.name}` 
          : item.name;
        return `${displayName} x${item.qty}`;
      }).join(', ');

      return {
        '日期': tx.date,
        '發票編號': tx.invoiceNumber,
        '客戶姓名': tx.customerName || '-',
        '客戶電話': tx.customerPhone || '-',
        '商品明細': itemsText,
        '小計': tx.subtotal,
        '折扣': tx.discount || 0,
        '調整金額': tx.adjustment || 0,
        '總金額': tx.total,
        '支付方式': tx.paymentMethod,
        '預計取貨日期': tx.pickupDate || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "發票總表");
    const fileName = `發票總表_${startDate || '全部'}_至_${endDate || '全部'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`已成功匯出 ${filteredTransactions.length} 筆訂單`, 'success');
  };

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
                {/* ==================== 銷售頁面 ==================== */}
        {activeTab === 'sales' && (
          <div className="flex gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4">商品與服務</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                  <div key={item.id} onClick={() => addToCart(item)} className="bg-white border rounded-2xl p-4 cursor-pointer hover:border-rose-300 transition-all hover:shadow-sm relative">
                    {item.isPopular && (
                      <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        常用
                      </div>
                    )}
                    <div className="font-semibold mb-1 pr-12">{item.name}</div>
                    <div className="text-sm text-slate-500 mb-2">{item.category}</div>
                    <div className="text-2xl font-bold">HK${item.price}</div>
                    {item.hasVariants && item.variants.length > 0 && (
                      <div className="text-xs text-emerald-600 mt-1">有 {item.variants.length} 個變體</div>
                    )}
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

              {cart.length > 0 ? (
                cart.map((item, index) => {
                  const displayName = item.selectedVariant 
                    ? `${item.name} - ${item.selectedVariant.name}` 
                    : item.name;
                  const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;

                  return (
                    <div key={index} className="border rounded-xl p-3 mb-2">
                      <div className="flex justify-between text-sm">
                        <div>{displayName} × {item.qty}</div>
                        <div>HK$${(itemPrice * item.qty).toFixed(0)}</div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateCartQty(index, item.qty - 1)} className="px-2 border rounded text-sm">-</button>
                        <button onClick={() => updateCartQty(index, item.qty + 1)} className="px-2 border rounded text-sm">+</button>
                        <button onClick={() => removeFromCart(index)} className="ml-auto text-red-500 text-xs">移除</button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-slate-400 py-4">購物車是空的</p>
              )}

              {cart.length > 0 && (
                <button onClick={openCheckout} className="mt-4 w-full bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition-colors">
                  結帳付款
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==================== 庫存頁面 ==================== */}
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
                    <th className="text-center w-32">操作</th>
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
                      <td className="text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openEditItemModal(item)} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">編輯</button>
                          <button onClick={() => deleteItem(item.id)} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">刪除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 訂單記錄頁面 ==================== */}
        {activeTab === 'reports' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">訂單記錄</h2>
              <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium">
                <FileDown className="w-4 h-4" /> 匯出 Excel
              </button>
            </div>

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

        {/* ==================== 客戶列表頁面 ==================== */}
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
                          <tr key={index} onClick={() => setSelectedCustomerForHistory(customer)} className="cursor-pointer hover:bg-slate-50">
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

        {/* ==================== 預約頁面 ==================== */}
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
            {/* ==================== 所有 Modal ==================== */}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closePaymentModal}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">確認付款</h2>
            <p className="text-4xl font-bold mb-6">HK${finalTotal}</p>

            <div className="mb-4">
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
              {selectedCustomerForCheckout && <div className="mt-2 text-sm text-emerald-600">已選擇：{selectedCustomerForCheckout.name}</div>}
            </div>

            {/* 預計取貨日期 */}
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-600 block mb-2">預計取貨日期（選填）</label>
              <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full border p-3 rounded-xl" />
            </div>

            {/* 折扣金額 */}
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-600 block mb-2">折扣金額（選填）</label>
              <input 
                type="number" 
                value={discountAmount} 
                onChange={(e) => setDiscountAmount(parseInt(e.target.value) || 0)} 
                className="w-full border p-3 rounded-xl" 
                placeholder="0" 
              />
            </div>

            {/* 調整金額（內部使用） */}
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-600 block mb-2">調整金額（內部使用，不顯示給客戶）</label>
              <input 
                type="number" 
                value={adjustment} 
                onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)} 
                className="w-full border p-3 rounded-xl" 
                placeholder="0" 
              />
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

      {/* Success Modal */}
      {isSuccessModalOpen && lastTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeSuccessModal}>
          <div className="bg-white rounded-3xl w-full max-w-xl p-8" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">交易成功！</h2>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => printReceipt(lastTransaction)} className="flex-1 bg-slate-100 py-3 rounded-xl font-semibold">編印 Receipt</button>
              <button onClick={() => printInvoice(lastTransaction)} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700">編印 Invoice</button>
              <button onClick={() => sendToWhatsApp(lastTransaction)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2"><Send className="w-5 h-5" /> 發送至客戶 WhatsApp</button>
            </div>
            <button onClick={closeSuccessModal} className="mt-6 w-full py-3 border rounded-xl">關閉</button>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
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
            {/* Add Item Modal */}
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

              {/* 變體設定 */}
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <input 
                    type="checkbox" 
                    checked={newItem.hasVariants} 
                    onChange={e => setNewItem({...newItem, hasVariants: e.target.checked, variants: e.target.checked ? newItem.variants : []})} 
                  />
                  <span className="text-sm font-medium">啟用變體</span>
                </div>

                {newItem.hasVariants && (
                  <div className="border rounded-xl p-3 space-y-3">
                    <div className="text-xs text-slate-500">變體列表（至少新增一個）</div>
                    {newItem.variants.map((variant, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="變體名稱" 
                          value={variant.name} 
                          onChange={e => {
                            const newVariants = [...newItem.variants];
                            newVariants[index].name = e.target.value;
                            setNewItem({...newItem, variants: newVariants});
                          }} 
                          className="flex-1 border p-2 rounded text-sm" 
                        />
                        <input 
                          type="number" 
                          placeholder="價格" 
                          value={variant.price} 
                          onChange={e => {
                            const newVariants = [...newItem.variants];
                            newVariants[index].price = parseInt(e.target.value) || 0;
                            setNewItem({...newItem, variants: newVariants});
                          }} 
                          className="w-24 border p-2 rounded text-sm" 
                        />
                        <button 
                          onClick={() => {
                            const newVariants = newItem.variants.filter((_, i) => i !== index);
                            setNewItem({...newItem, variants: newVariants});
                          }} 
                          className="px-3 text-red-500 text-sm"
                        >
                          刪除
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        setNewItem({
                          ...newItem, 
                          variants: [...newItem.variants, { id: Date.now(), name: '', price: 0 }]
                        });
                      }} 
                      className="text-sm text-rose-600 hover:underline"
                    >
                      + 新增變體
                    </button>
                  </div>
                )}
              </div>

              {newItem.type === 'product' && (
                <div>
                  <label className="text-sm font-medium text-slate-600">初始庫存</label>
                  <input type="number" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} className="w-full border p-3 rounded-xl mt-1" placeholder="10" />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" checked={newItem.isPopular} onChange={e => setNewItem({...newItem, isPopular: e.target.checked})} />
                <span className="text-sm">設為常用項目</span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsAddItemModalOpen(false)} className="flex-1 py-3 border rounded-xl">取消</button>
              <button onClick={handleAddItem} className="flex-1 py-3 bg-rose-600 text-white rounded-xl">確認新增</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditItemModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsEditItemModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">編輯商品 / 服務</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">名稱</label>
                <input type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full border p-3 rounded-xl mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">類型</label>
                  <select value={editingItem.type} onChange={e => setEditingItem({...editingItem, type: e.target.value})} className="w-full border p-3 rounded-xl mt-1">
                    <option value="product">商品</option>
                    <option value="service">服務</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">價格</label>
                  <input type="number" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} className="w-full border p-3 rounded-xl mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">類別</label>
                <input type="text" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full border p-3 rounded-xl mt-1" />
              </div>

              {/* 變體設定（編輯） */}
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <input 
                    type="checkbox" 
                    checked={editingItem.hasVariants} 
                    onChange={e => setEditingItem({...editingItem, hasVariants: e.target.checked})} 
                  />
                  <span className="text-sm font-medium">啟用變體</span>
                </div>

                {editingItem.hasVariants && (
                  <div className="border rounded-xl p-3 space-y-3">
                    {(editingItem.variants || []).map((variant, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="變體名稱" 
                          value={variant.name} 
                          onChange={e => {
                            const newVariants = [...editingItem.variants];
                            newVariants[index].name = e.target.value;
                            setEditingItem({...editingItem, variants: newVariants});
                          }} 
                          className="flex-1 border p-2 rounded text-sm" 
                        />
                        <input 
                          type="number" 
                          placeholder="價格" 
                          value={variant.price} 
                          onChange={e => {
                            const newVariants = [...editingItem.variants];
                            newVariants[index].price = parseInt(e.target.value) || 0;
                            setEditingItem({...editingItem, variants: newVariants});
                          }} 
                          className="w-24 border p-2 rounded text-sm" 
                        />
                        <button 
                          onClick={() => {
                            const newVariants = editingItem.variants.filter((_, i) => i !== index);
                            setEditingItem({...editingItem, variants: newVariants});
                          }} 
                          className="px-3 text-red-500 text-sm"
                        >
                          刪除
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        setEditingItem({
                          ...editingItem, 
                          variants: [...(editingItem.variants || []), { id: Date.now(), name: '', price: 0 }]
                        });
                      }} 
                      className="text-sm text-rose-600 hover:underline"
                    >
                      + 新增變體
                    </button>
                  </div>
                )}
              </div>

              {editingItem.type === 'product' && (
                <div>
                  <label className="text-sm font-medium text-slate-600">庫存</label>
                  <input type="number" value={editingItem.stock} onChange={e => setEditingItem({...editingItem, stock: e.target.value})} className="w-full border p-3 rounded-xl mt-1" />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" checked={editingItem.isPopular} onChange={e => setEditingItem({...editingItem, isPopular: e.target.checked})} />
                <span className="text-sm">設為常用項目</span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsEditItemModalOpen(false)} className="flex-1 py-3 border rounded-xl">取消</button>
              <button onClick={handleEditItem} className="flex-1 py-3 bg-rose-600 text-white rounded-xl">儲存修改</button>
            </div>
          </div>
        </div>
      )}

      {/* 變體選擇 Modal */}
      {isVariantModalOpen && selectedItemForVariant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsVariantModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-center">請選擇變體</h3>
            <div className="space-y-2">
              {selectedItemForVariant.variants.map(variant => (
                <button 
                  key={variant.id} 
                  onClick={() => confirmVariantAndAddToCart(variant)}
                  className="w-full text-left p-4 border rounded-xl hover:bg-rose-50 flex justify-between items-center"
                >
                  <span>{variant.name}</span>
                  <span className="font-semibold">HK${variant.price}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setIsVariantModalOpen(false)} className="mt-4 w-full py-2 text-sm text-slate-500">取消</button>
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

      {/* 客戶消費紀錄 Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCustomerForHistory(null)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">客戶消費紀錄</h2>
              <button onClick={() => setSelectedCustomerForHistory(null)} className="text-xl">×</button>
            </div>
            
            <div className="mb-4">
              <p className="text-lg font-semibold">{selectedCustomerForHistory.name}</p>
              <p className="text-slate-500">{selectedCustomerForHistory.phone || '無電話'}</p>
            </div>

            <div className="max-h-[400px] overflow-auto border rounded-2xl">
              {transactions
                .filter(tx => 
                  (tx.customerName && tx.customerName === selectedCustomerForHistory.name) || 
                  (tx.customerPhone && tx.customerPhone === selectedCustomerForHistory.phone)
                )
                .sort((a, b) => b.date.localeCompare(a.date))
                .length > 0 ? (
                <table className="pos-table w-full">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>發票編號</th>
                      <th>項目</th>
                      <th className="text-right">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(tx => 
                        (tx.customerName && tx.customerName === selectedCustomerForHistory.name) || 
                        (tx.customerPhone && tx.customerPhone === selectedCustomerForHistory.phone)
                      )
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(tx => (
                        <tr key={tx.id}>
                          <td>{tx.date}</td>
                          <td className="font-mono text-sm">{tx.invoiceNumber}</td>
                          <td className="text-sm">
                            {tx.items.map(i => {
                              const displayName = i.selectedVariant 
                                ? `${i.name} - ${i.selectedVariant.name}` 
                                : i.name;
                              return displayName;
                            }).join(', ')}
                          </td>
                          <td className="text-right font-semibold">HK${tx.total}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-slate-400">此客戶尚無消費紀錄</div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedCustomerForHistory(null)} className="px-6 py-2 border rounded-xl">關閉</button>
            </div>
          </div>
        </div>
      )}
            {toast && <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-2xl">{toast.message}</div>}
    </div>
  );
}
export default App;
