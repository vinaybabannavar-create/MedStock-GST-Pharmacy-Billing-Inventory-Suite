import React, { useState, useEffect } from 'react';
import api, { getAuthHeaders } from './api';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  UserSquare2, 
  LogOut, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  FolderOpen,
  UserCheck,
  ShoppingCart,
  Receipt,
  Printer,
  X,
  RotateCcw,
  Trash2,
  Menu
} from 'lucide-react';

// Import refactored page components
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data states
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [salesSummary, setSalesSummary] = useState(null);

  // Billing tab states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState('9999999999');
  const [walkInStateCode, setWalkInStateCode] = useState('29');
  
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('0.00');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [finalInvoice, setFinalInvoice] = useState(null); // Shows receipt modal

  // Create forms
  const [newMedicine, setNewMedicine] = useState({
    name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '18.00', unit: 'Strip', category: 'Tablet'
  });
  const [newSupplier, setNewSupplier] = useState({
    name: '', gstin: '', phone: '', address: '', state_code: '29'
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '', phone: '', address: '', state_code: '29'
  });
  const [newBatch, setNewBatch] = useState({
    medicine_id: '', batch_no: '', expiry_date: '', quantity: 100, purchase_price: '50.00', mrp: '99.00', supplier_id: ''
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null });

  // Helper: safely extract a readable string from backend error responses
  const getErrMsg = (detail, fallback) => {
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      // Pydantic validation errors: [{loc, msg, type}, ...]
      return detail.map(d => d.msg || JSON.stringify(d)).join('; ');
    }
    return String(detail);
  };

  const triggerNotification = (message, type = 'success') => {
    // Always ensure message is a string to prevent React render crash
    const safeMsg = typeof message === 'string' ? message : getErrMsg(message, 'Unknown error');
    setNotification({ show: true, message: safeMsg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Restore Software: reset all UI state to defaults and refresh data from backend
  const handleRestoreSoftware = () => {
    setConfirmModal({ show: false, type: null });
    // Reset active tab to dashboard
    setActiveTab('dashboard');
    // Reset billing states
    setSelectedCustomerId('');
    setWalkInName('Walk-in Customer');
    setWalkInPhone('9999999999');
    setWalkInStateCode('29');
    setMedSearchQuery('');
    setCart([]);
    setDiscount('0.00');
    setPaymentMode('Cash');
    setFinalInvoice(null);
    // Reset create forms
    setNewMedicine({ name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '18.00', unit: 'Strip', category: 'Tablet' });
    setNewSupplier({ name: '', gstin: '', phone: '', address: '', state_code: '29' });
    setNewCustomer({ name: '', phone: '', address: '', state_code: '29' });
    setNewBatch({ medicine_id: '', batch_no: '', expiry_date: '', quantity: 100, purchase_price: '50.00', mrp: '99.00', supplier_id: '' });
    // Re-fetch fresh data from backend
    fetchData();
    triggerNotification('Software restored to default state!');
  };

  // Clear History: wipe ALL data from the backend database + reset UI
  const handleClearHistory = async () => {
    setConfirmModal({ show: false, type: null });
    try {
      await api.post(`/analytics/clear-all`, {}, getAuthHeaders(token));
      triggerNotification('All data cleared from the database!');
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to clear backend data'), 'error');
    }
    // Reset all UI state
    setCart([]);
    setFinalInvoice(null);
    setDiscount('0.00');
    setPaymentMode('Cash');
    setMedSearchQuery('');
    setSelectedCustomerId('');
    setWalkInName('Walk-in Customer');
    setWalkInPhone('9999999999');
    setWalkInStateCode('29');
    setNewMedicine({ name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '18.00', unit: 'Strip', category: 'Tablet' });
    setNewSupplier({ name: '', gstin: '', phone: '', address: '', state_code: '29' });
    setNewCustomer({ name: '', phone: '', address: '', state_code: '29' });
    setNewBatch({ medicine_id: '', batch_no: '', expiry_date: '', quantity: 100, purchase_price: '50.00', mrp: '99.00', supplier_id: '' });
    setSales([]); setAlerts(null); setSalesSummary(null);
    setMedicines([]); setBatches([]); setSuppliers([]); setCustomers([]);
    localStorage.removeItem('activeTab');
    setActiveTab('dashboard');
  };

  // Quick-add customer directly from billing screen
  const handleQuickAddCustomer = async (custData) => {
    try {
      const res = await api.post(`/customers/`, custData, getAuthHeaders(token));
      await fetchData(); // refresh customers list
      // Auto-select newly created customer
      setSelectedCustomerId(String(res.data.id));
      triggerNotification(`Customer "${res.data.name}" added and selected!`);
      return true;
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to add customer'), 'error');
      return false;
    }
  };

  // Quick-add medicine directly from billing/inventory screen
  const handleQuickAddMedicine = async (medData) => {
    try {
      const res = await api.post(`/medicines/`, medData, getAuthHeaders(token));
      await fetchData(); // refresh medicines list
      setNewBatch(prev => ({ ...prev, medicine_id: String(res.data.id) }));
      triggerNotification(`Medicine "${medData.name}" added to catalog!`);
      return true;
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to add medicine'), 'error');
      return false;
    }
  };

  // Quick-add supplier directly from inventory screen
  const handleQuickAddSupplier = async (supData) => {
    try {
      const res = await api.post(`/suppliers/`, supData, getAuthHeaders(token));
      await fetchData(); // refresh suppliers list
      setNewBatch(prev => ({ ...prev, supplier_id: String(res.data.id) }));
      triggerNotification(`Supplier "${res.data.name}" added and selected!`);
      return true;
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to add supplier'), 'error');
      return false;
    }
  };

  // ── Per-row delete handlers ──
  const handleDeleteMedicine = async (id) => {
    try {
      await api.delete(`/medicines/${id}`, getAuthHeaders(token));
      triggerNotification('Medicine deleted successfully');
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Cannot delete: medicine may have linked batches or sales'), 'error');
    }
  };

  const handleDeleteBatch = async (id) => {
    try {
      await api.delete(`/batches/${id}`, getAuthHeaders(token));
      triggerNotification('Batch deleted successfully');
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Cannot delete: batch may be referenced by existing sales'), 'error');
    }
  };

  const handleDeleteAllMedicines = async () => {
    try {
      // Delete all batches first (FK dependency), then medicines
      for (const b of batches) {
        await api.delete(`/batches/${b.id}`, getAuthHeaders(token));
      }
      for (const m of medicines) {
        await api.delete(`/medicines/${m.id}`, getAuthHeaders(token));
      }
      triggerNotification('All medicines and batches deleted');
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Some items could not be deleted (may be referenced by sales)'), 'error');
      fetchData();
    }
  };

  const handleDeleteAllBatches = async () => {
    try {
      for (const b of batches) {
        await api.delete(`/batches/${b.id}`, getAuthHeaders(token));
      }
      triggerNotification('All batches deleted');
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Some batches could not be deleted'), 'error');
      fetchData();
    }
  };

  useEffect(() => {
    if (token) {
      api.get(`/auth/me`, getAuthHeaders(token))
        .then(res => {
          setUser(res.data);
          fetchData();
        })
        .catch(err => {
          handleLogout();
        });
    }
  }, [token]);

  const fetchData = () => {
    const headers = getAuthHeaders(token);
    api.get(`/medicines/`, headers).then(res => setMedicines(res.data)).catch(console.error);
    api.get(`/suppliers/`, headers).then(res => setSuppliers(res.data)).catch(console.error);
    api.get(`/customers/`, headers).then(res => setCustomers(res.data)).catch(console.error);
    api.get(`/batches/`, headers).then(res => setBatches(res.data)).catch(console.error);
    api.get(`/sales/`, headers).then(res => setSales(res.data)).catch(console.error);
    api.get(`/analytics/alerts`, headers).then(res => setAlerts(res.data)).catch(console.error);
    api.get(`/analytics/sales-summary`, headers).then(res => setSalesSummary(res.data)).catch(console.error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const res = await api.post(`/auth/login`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
      triggerNotification('Successfully logged in!');
    } catch (err) {
      setLoginError(getErrMsg(err.response?.data?.detail, 'Failed to connect to backend server'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  // Add item to cart using FEFO selection
  const handleAddToCart = (medicine) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const availableBatches = batches
      .filter(b => b.medicine_id === medicine.id && b.quantity > 0 && b.expiry_date >= todayStr)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

    if (availableBatches.length === 0) {
      triggerNotification(`No active stock batches found for ${medicine.name}`, 'error');
      return;
    }

    const fefoBatch = availableBatches[0];

    // Check if batch already exists in cart
    const existingIndex = cart.findIndex(item => item.batch_id === fefoBatch.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].quantity + 1 > fefoBatch.quantity) {
        triggerNotification(`Cannot exceed available batch stock (${fefoBatch.quantity})`, 'error');
        return;
      }
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        medicine_id: medicine.id,
        name: medicine.name,
        generic_name: medicine.generic_name,
        batch_id: fefoBatch.id,
        batch_no: fefoBatch.batch_no,
        expiry_date: fefoBatch.expiry_date,
        max_quantity: fefoBatch.quantity,
        sale_price: parseFloat(fefoBatch.mrp).toFixed(2), // default to MRP
        gst_rate: parseFloat(medicine.gst_rate),
        quantity: 1
      }]);
    }
    triggerNotification(`Added ${medicine.name} (Batch: ${fefoBatch.batch_no}) to cart`);
  };

  const updateCartQty = (index, qty) => {
    const updated = [...cart];
    const item = updated[index];
    const parsedQty = parseInt(qty) || 0;
    if (parsedQty > item.max_quantity) {
      triggerNotification(`Only ${item.max_quantity} units available in Batch ${item.batch_no}`, 'error');
      item.quantity = item.max_quantity;
    } else {
      item.quantity = parsedQty;
    }
    setCart(updated);
  };

  const updateCartPrice = (index, price) => {
    const updated = [...cart];
    updated[index].sale_price = price;
    setCart(updated);
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    triggerNotification('Item removed from cart');
  };

  // Selecting a different customer clears the cart so items don't carry over
  const handleSelectCustomer = (customerId) => {
    if (customerId !== selectedCustomerId) {
      setCart([]);
      setDiscount('0.00');
    }
    setSelectedCustomerId(customerId);
  };

  // GST State Calculation logic
  const getCustomerStateCode = () => {
    if (selectedCustomerId) {
      const cust = customers.find(c => c.id === parseInt(selectedCustomerId));
      return cust?.state_code || '29';
    }
    return walkInStateCode || '29';
  };

  const isLocalCustomer = () => {
    return getCustomerStateCode() === '29';
  };

  // Computations
  const getCartTotals = () => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    cart.forEach(item => {
      const price = parseFloat(item.sale_price) || 0;
      const qty = item.quantity || 0;
      const itemSubtotal = price * qty;
      const rate = item.gst_rate / 100;

      subtotal += itemSubtotal;
      if (isLocalCustomer()) {
        const itemCgst = itemSubtotal * (rate / 2);
        cgst += itemCgst;
        sgst += itemCgst;
      } else {
        igst += itemSubtotal * rate;
      }
    });

    const discVal = parseFloat(discount) || 0;
    const total = subtotal + cgst + sgst + igst - discVal;

    return {
      subtotal: subtotal.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      igst: igst.toFixed(2),
      total: Math.max(0, total).toFixed(2)
    };
  };

  const totals = getCartTotals();

  // Submit sale to backend
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerNotification('Cart is empty', 'error');
      return;
    }

    const salePayload = {
      customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
      customer_name: selectedCustomerId ? null : walkInName,
      customer_phone: selectedCustomerId ? null : walkInPhone,
      customer_state_code: getCustomerStateCode(),
      payment_mode: paymentMode,
      discount: parseFloat(discount) || 0,
      items: cart.map(item => ({
        batch_id: item.batch_id,
        quantity: item.quantity,
        sale_price: parseFloat(item.sale_price)
      }))
    };

    try {
      const res = await api.post(`/sales/`, salePayload, getAuthHeaders(token));
      triggerNotification('Sale successfully finalized!');
      setFinalInvoice(res.data);
      setCart([]);
      setDiscount('0.00');
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to complete checkout'), 'error');
    }
  };

  // Download PDF invoice from backend
  const handleDownloadPdf = async (saleId, invoiceNo) => {
    try {
      const res = await api.get(`/sales/${saleId}/pdf`, {
        ...getAuthHeaders(token),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      triggerNotification('PDF downloaded successfully!');
    } catch (err) {
      triggerNotification('Failed to download PDF. Please try again.', 'error');
    }
  };

  // Add handlers
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/medicines/`, newMedicine, getAuthHeaders(token));
      triggerNotification('Medicine added successfully');
      setNewMedicine({ name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '18.00', unit: 'Strip', category: 'Tablet' });
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to add medicine'), 'error');
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/suppliers/`, newSupplier, getAuthHeaders(token));
      triggerNotification('Supplier added successfully');
      setNewSupplier({ name: '', gstin: '', phone: '', address: '', state_code: '29' });
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to add supplier'), 'error');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/customers/`, newCustomer, getAuthHeaders(token));
      triggerNotification('Customer added successfully');
      setNewCustomer({ name: '', phone: '', address: '', state_code: '29' });
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to add customer'), 'error');
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/batches/`, newBatch, getAuthHeaders(token));
      triggerNotification('Batch added successfully');
      setNewBatch({ medicine_id: '', batch_no: '', expiry_date: '', quantity: 100, purchase_price: '50.00', mrp: '99.00', supplier_id: '' });
      fetchData();
    } catch (err) {
      triggerNotification(getErrMsg(err.response?.data?.detail, 'Failed to add batch'), 'error');
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
    (m.generic_name && m.generic_name.toLowerCase().includes(medSearchQuery.toLowerCase()))
  );

  if (!token) {
    return (
      <LoginPage
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        loginError={loginError}
        loginLoading={loginLoading}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden relative font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-950 border-b border-slate-900 flex items-center justify-between p-4 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white hover:text-indigo-400 focus:outline-none transition-colors"
          >
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider">Medi<span className="text-indigo-400">Ledger</span></h1>
          </div>
        </div>
        {user && (
          <div className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg">
            <UserCheck size={18} />
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 py-3.5 px-6 rounded-2xl shadow-2xl border text-white backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
          notification.type === 'error' ? 'bg-rose-600/95 border-rose-500/50' : 'bg-emerald-600/95 border-emerald-500/50'
        }`}>
          <CheckCircle size={20} className="shrink-0" />
          <span className="text-sm font-bold tracking-tight">{notification.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 transform scale-100 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              confirmModal.type === 'restore' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {confirmModal.type === 'restore'
                ? <RotateCcw size={24} className="animate-spin" style={{ animationDuration: '3s' }} />
                : <Trash2 size={24} />
              }
            </div>
            <h3 className="text-center text-xl font-extrabold text-slate-900 mb-2">
              {confirmModal.type === 'restore' ? 'Restore Software?' : 'Clear All History?'}
            </h3>
            <p className="text-center text-sm text-slate-500 mb-6 leading-relaxed">
              {confirmModal.type === 'restore'
                ? 'This will reset all page states, forms, and cart to default. Fresh data will be loaded from the server.'
                : 'This will permanently clear your cart, all form drafts, and browsing history across all pages. Backend records are not deleted.'
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ show: false, type: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.type === 'restore' ? handleRestoreSoftware : handleClearHistory}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all ${
                  confirmModal.type === 'restore'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmModal.type === 'restore' ? 'Yes, Restore' : 'Yes, Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice receipt slip modal */}
      {finalInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100 flex flex-col justify-between max-h-[90vh]">
            <button 
              onClick={() => setFinalInvoice(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <h3 className="text-xl font-black text-slate-900 tracking-wider">MEDILEDGER PHARMACY</h3>
                <p className="text-xs text-slate-500 mt-1">Karnataka, GSTIN: 29MMMMM8888M1Z0</p>
                <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Ph: 9988776655</p>
              </div>

              <div className="py-4 text-xs space-y-1.5 border-b border-dashed border-slate-200 font-mono text-slate-600">
                <div className="flex justify-between"><span>Invoice:</span><span className="font-bold text-slate-950">{finalInvoice.invoice_no}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{finalInvoice.date}</span></div>
                <div className="flex justify-between"><span>Cashier ID:</span><span>User #{finalInvoice.created_by}</span></div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="text-slate-950 font-bold">
                    {finalInvoice.customer_id ? `Saved Cust #${finalInvoice.customer_id}` : 'Walk-in Customer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Customer State Code:</span>
                  <span>{getCustomerStateCode()} {isLocalCustomer() ? '(Local)' : '(Interstate)'}</span>
                </div>
              </div>

              <table className="w-full mt-4 text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-dashed border-slate-200 text-slate-400 text-[10px]">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-100 text-slate-800">
                  {finalInvoice.items?.map(it => {
                    const matchedBatch = batches.find(b => b.id === it.batch_id);
                    const matchedMed = matchedBatch ? medicines.find(m => m.id === matchedBatch.medicine_id) : null;
                    return (
                      <tr key={it.id} className="align-top">
                        <td className="py-2.5">
                          <span className="font-bold block text-slate-900">{matchedMed?.name || `Batch #${it.batch_id}`}</span>
                          <span className="text-[10px] text-slate-400">Batch: {matchedBatch?.batch_no} | Exp: {matchedBatch?.expiry_date}</span>
                        </td>
                        <td className="py-2.5 text-right font-bold">{it.quantity}</td>
                        <td className="py-2.5 text-right">₹{parseFloat(it.sale_price).toFixed(2)}</td>
                        <td className="py-2.5 text-right font-bold">₹{parseFloat(it.line_total).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-1.5 font-mono text-xs text-slate-600">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{parseFloat(finalInvoice.subtotal).toFixed(2)}</span></div>
                {parseFloat(finalInvoice.cgst_amount) > 0 && (
                  <div className="flex justify-between"><span>CGST:</span><span>₹{parseFloat(finalInvoice.cgst_amount).toFixed(2)}</span></div>
                )}
                {parseFloat(finalInvoice.sgst_amount) > 0 && (
                  <div className="flex justify-between"><span>SGST:</span><span>₹{parseFloat(finalInvoice.sgst_amount).toFixed(2)}</span></div>
                )}
                {parseFloat(finalInvoice.igst_amount) > 0 && (
                  <div className="flex justify-between"><span>IGST:</span><span>₹{parseFloat(finalInvoice.igst_amount).toFixed(2)}</span></div>
                )}
                {parseFloat(finalInvoice.discount) > 0 && (
                  <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-₹{parseFloat(finalInvoice.discount).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{parseFloat(finalInvoice.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-[10px] text-slate-400 font-bold border-t border-dashed border-slate-200 pt-3">
                <p>THANK YOU FOR YOUR VISIT</p>
                <p className="mt-0.5 font-mono text-[8px]">Invoices are GST Compliant</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => handleDownloadPdf(finalInvoice.id, finalInvoice.invoice_no)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                <span>Download PDF Invoice</span>
              </button>
              <button 
                onClick={() => setFinalInvoice(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-lg text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-5 shrink-0 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="py-4 border-b border-slate-900 text-center mb-6">
            <h1 className="text-2xl font-black text-white tracking-widest">Medi<span className="text-indigo-400">Ledger</span></h1>
            <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest mt-1">Karnataka Store Suite</p>
          </div>

          <div className="space-y-1.5">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
              { id: 'billing', name: 'Billing Counter', icon: ShoppingCart },
              { id: 'inventory', name: 'Inventory & Medicines', icon: Package },
              { id: 'suppliers', name: 'Suppliers', icon: Truck },
              { id: 'customers', name: 'Customers', icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-bold text-sm transition-all smooth-hover cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-xl shadow-indigo-600/10 border-l-4 border-indigo-400' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-900 pt-4 space-y-2.5">
          {user && (
            <div className="bg-slate-900/60 p-3.5 rounded-2xl flex items-center gap-3 mb-1 border border-slate-900">
              <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl">
                <UserCheck size={18} />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-black text-white truncate">{user.name}</h4>
                <p className="text-[9px] text-slate-400 capitalize font-mono tracking-wider">{user.role}</p>
              </div>
            </div>
          )}

          {/* Restore Software */}
          <button
            onClick={() => setConfirmModal({ show: true, type: 'restore' })}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/30 text-indigo-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Restore Software</span>
          </button>

          {/* Clear History */}
          <button
            onClick={() => setConfirmModal({ show: true, type: 'clear' })}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/30 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full h-[calc(100vh-68px)] md:h-screen">
        {activeTab === 'dashboard' && (
          <Dashboard
            salesSummary={salesSummary}
            medicines={medicines}
            batches={batches}
            suppliers={suppliers}
            customers={customers}
            alerts={alerts}
          />
        )}

        {activeTab === 'billing' && (
          <Billing
            customers={customers}
            medicines={medicines}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={handleSelectCustomer}
            walkInName={walkInName}
            setWalkInName={setWalkInName}
            walkInPhone={walkInPhone}
            setWalkInPhone={setWalkInPhone}
            walkInStateCode={walkInStateCode}
            setWalkInStateCode={setWalkInStateCode}
            medSearchQuery={medSearchQuery}
            setMedSearchQuery={setMedSearchQuery}
            filteredMedicines={filteredMedicines}
            cart={cart}
            setCart={setCart}
            discount={discount}
            setDiscount={setDiscount}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            totals={totals}
            handleAddToCart={handleAddToCart}
            updateCartQty={updateCartQty}
            updateCartPrice={updateCartPrice}
            removeFromCart={removeFromCart}
            handleCheckout={handleCheckout}
            getCustomerStateCode={getCustomerStateCode}
            isLocalCustomer={isLocalCustomer}
            handleQuickAddCustomer={handleQuickAddCustomer}
            handleQuickAddMedicine={handleQuickAddMedicine}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            newMedicine={newMedicine}
            setNewMedicine={setNewMedicine}
            handleAddMedicine={handleAddMedicine}
            newBatch={newBatch}
            setNewBatch={setNewBatch}
            handleAddBatch={handleAddBatch}
            medicines={medicines}
            batches={batches}
            suppliers={suppliers}
            newSupplier={newSupplier}
            setNewSupplier={setNewSupplier}
            handleAddSupplier={handleAddSupplier}
            handleDeleteMedicine={handleDeleteMedicine}
            handleDeleteBatch={handleDeleteBatch}
            handleDeleteAllMedicines={handleDeleteAllMedicines}
            handleDeleteAllBatches={handleDeleteAllBatches}
            handleQuickAddMedicine={handleQuickAddMedicine}
            handleQuickAddSupplier={handleQuickAddSupplier}
          />
        )}

        {activeTab === 'suppliers' && (
          <Suppliers
            newSupplier={newSupplier}
            setNewSupplier={setNewSupplier}
            handleAddSupplier={handleAddSupplier}
            suppliers={suppliers}
          />
        )}

        {activeTab === 'customers' && (
          <Customers
            newCustomer={newCustomer}
            setNewCustomer={setNewCustomer}
            handleAddCustomer={handleAddCustomer}
            customers={customers}
          />
        )}
      </main>
    </div>
  );
}
