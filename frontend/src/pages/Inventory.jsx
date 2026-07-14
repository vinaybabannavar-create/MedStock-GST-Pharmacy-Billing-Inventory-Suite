import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle, X, UserPlus, Pill } from 'lucide-react';

export default function Inventory({
  newMedicine,
  setNewMedicine,
  handleAddMedicine,
  newBatch,
  setNewBatch,
  handleAddBatch,
  medicines,
  batches,
  suppliers,
  // Delete handlers passed from App.jsx
  handleDeleteMedicine,
  handleDeleteBatch,
  handleDeleteAllMedicines,
  handleDeleteAllBatches,
  // Quick-add handlers passed from App.jsx
  handleQuickAddMedicine,
  handleQuickAddSupplier,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  // confirmDelete = { type: 'medicine'|'batch'|'all-medicines'|'all-batches', id?: number, label?: string }

  // Quick-add form states
  const [showQuickMed, setShowQuickMed] = useState(false);
  const [quickMed, setQuickMed] = useState({
    name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '12.00', unit: 'Strip', category: 'Tablet'
  });
  const [medLoading, setMedLoading] = useState(false);

  const [showQuickSup, setShowQuickSup] = useState(false);
  const [quickSup, setQuickSup] = useState({
    name: '', gstin: '', phone: '', address: '', state_code: '29'
  });
  const [supLoading, setSupLoading] = useState(false);

  const submitQuickMed = async (e) => {
    e.preventDefault();
    setMedLoading(true);
    const ok = await handleQuickAddMedicine(quickMed);
    if (ok) {
      setQuickMed({ name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '12.00', unit: 'Strip', category: 'Tablet' });
      setShowQuickMed(false);
    }
    setMedLoading(false);
  };

  const submitQuickSup = async (e) => {
    e.preventDefault();
    setSupLoading(true);
    const ok = await handleQuickAddSupplier(quickSup);
    if (ok) {
      setQuickSup({ name: '', gstin: '', phone: '', address: '', state_code: '29' });
      setShowQuickSup(false);
    }
    setSupLoading(false);
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'medicine') handleDeleteMedicine(confirmDelete.id);
    else if (confirmDelete.type === 'batch') handleDeleteBatch(confirmDelete.id);
    else if (confirmDelete.type === 'all-medicines') handleDeleteAllMedicines();
    else if (confirmDelete.type === 'all-batches') handleDeleteAllBatches();
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">

      {/* ── Confirmation Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-rose-600" />
            </div>
            <h3 className="text-center text-lg font-black text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-center text-sm text-slate-500 mb-6">
              {confirmDelete.type === 'all-medicines'
                ? `Delete ALL ${medicines.length} medicines and their batches? This cannot be undone.`
                : confirmDelete.type === 'all-batches'
                ? `Delete ALL ${batches.length} batch records? This cannot be undone.`
                : `Delete "${confirmDelete.label}"? This cannot be undone.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory & Medicines</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage medicine items and stock batches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="space-y-6 lg:col-span-1">
          {/* Add Medicine Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-500" />
              <span>Create New Medicine</span>
            </h3>
            
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={newMedicine.name}
                  onChange={e => setNewMedicine({...newMedicine, name: e.target.value})}
                  required
                  placeholder="e.g. Paracetamol 650mg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Generic Name</label>
                <input
                  type="text"
                  value={newMedicine.generic_name}
                  onChange={e => setNewMedicine({...newMedicine, generic_name: e.target.value})}
                  placeholder="e.g. Paracetamol"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newMedicine.manufacturer}
                    onChange={e => setNewMedicine({...newMedicine, manufacturer: e.target.value})}
                    required
                    placeholder="e.g. Cipla"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={newMedicine.hsn_code}
                    onChange={e => setNewMedicine({...newMedicine, hsn_code: e.target.value})}
                    required
                    placeholder="30049099"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">GST Rate (%)</label>
                  <select
                    value={newMedicine.gst_rate}
                    onChange={e => setNewMedicine({...newMedicine, gst_rate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="0.00">0%</option>
                    <option value="5.00">5%</option>
                    <option value="12.00">12%</option>
                    <option value="18.00">18%</option>
                    <option value="28.00">28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newMedicine.unit}
                    onChange={e => setNewMedicine({...newMedicine, unit: e.target.value})}
                    required
                    placeholder="Strip"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <input
                    type="text"
                    value={newMedicine.category}
                    onChange={e => setNewMedicine({...newMedicine, category: e.target.value})}
                    required
                    placeholder="Tablet"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
              >
                Save Medicine
              </button>
            </form>
          </div>

          {/* Add Batch Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-indigo-500" />
              <span>Record Medicine Batch</span>
            </h3>
            
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-500">Select Medicine</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickMed(!showQuickMed)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
                  >
                    {showQuickMed ? <X size={12} /> : <Plus size={12} />}
                    {showQuickMed ? 'Cancel Add' : 'Add New'}
                  </button>
                </div>

                {showQuickMed ? (
                  <div className="mb-3 p-3 bg-blue-50/60 border border-blue-100 rounded-lg space-y-2.5">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Quick Add Medicine</p>
                    <div>
                      <input
                        type="text" required placeholder="Medicine Name *"
                        value={quickMed.name}
                        onChange={e => setQuickMed({...quickMed, name: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" placeholder="Generic Name"
                        value={quickMed.generic_name}
                        onChange={e => setQuickMed({...quickMed, generic_name: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                      <input
                        type="text" required placeholder="HSN Code *"
                        value={quickMed.hsn_code}
                        onChange={e => setQuickMed({...quickMed, hsn_code: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={quickMed.gst_rate}
                        onChange={e => setQuickMed({...quickMed, gst_rate: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      >
                        <option value="0.00">0%</option>
                        <option value="5.00">5%</option>
                        <option value="12.00">12%</option>
                        <option value="18.00">18%</option>
                      </select>
                      <input
                        type="text" required placeholder="Unit (e.g. Strip)"
                        value={quickMed.unit}
                        onChange={e => setQuickMed({...quickMed, unit: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" required placeholder="Category (e.g. Tablet)"
                        value={quickMed.category}
                        onChange={e => setQuickMed({...quickMed, category: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                      <input
                        type="text" required placeholder="Manufacturer"
                        value={quickMed.manufacturer}
                        onChange={e => setQuickMed({...quickMed, manufacturer: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={medLoading}
                      onClick={submitQuickMed}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs transition-all"
                    >
                      {medLoading ? 'Saving...' : 'Save & Select Medicine'}
                    </button>
                  </div>
                ) : (
                  <select
                    value={newBatch.medicine_id}
                    onChange={e => setNewBatch({...newBatch, medicine_id: e.target.value})}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Medicine --</option>
                    {medicines.map(med => (
                      <option key={med.id} value={med.id}>{med.name} ({med.manufacturer})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={newBatch.batch_no}
                    onChange={e => setNewBatch({...newBatch, batch_no: e.target.value})}
                    required
                    placeholder="BAT1002"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newBatch.expiry_date}
                    onChange={e => setNewBatch({...newBatch, expiry_date: e.target.value})}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newBatch.quantity}
                    onChange={e => setNewBatch({...newBatch, quantity: parseInt(e.target.value) || 0})}
                    required
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Cost Price (₹)</label>
                  <input
                    type="text"
                    value={newBatch.purchase_price}
                    onChange={e => setNewBatch({...newBatch, purchase_price: e.target.value})}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">MRP (₹)</label>
                  <input
                    type="text"
                    value={newBatch.mrp}
                    onChange={e => setNewBatch({...newBatch, mrp: e.target.value})}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-500">Select Supplier</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickSup(!showQuickSup)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                  >
                    {showQuickSup ? <X size={12} /> : <Plus size={12} />}
                    {showQuickSup ? 'Cancel Add' : 'Add New'}
                  </button>
                </div>

                {showQuickSup ? (
                  <div className="mb-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg space-y-2.5">
                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Quick Add Supplier</p>
                    <div>
                      <input
                        type="text" required placeholder="Supplier Name *"
                        value={quickSup.name}
                        onChange={e => setQuickSup({...quickSup, name: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" required placeholder="GSTIN *"
                        value={quickSup.gstin}
                        onChange={e => setQuickSup({...quickSup, gstin: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                      />
                      <input
                        type="text" required placeholder="Phone *"
                        value={quickSup.phone}
                        onChange={e => setQuickSup({...quickSup, phone: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text" required placeholder="State Code (e.g. 29)"
                        value={quickSup.state_code}
                        onChange={e => setQuickSup({...quickSup, state_code: e.target.value})}
                        maxLength="2"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                      />
                      <input
                        type="text" required placeholder="Address"
                        value={quickSup.address}
                        onChange={e => setQuickSup({...quickSup, address: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={supLoading}
                      onClick={submitQuickSup}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-xs transition-all"
                    >
                      {supLoading ? 'Saving...' : 'Save & Select Supplier'}
                    </button>
                  </div>
                ) : (
                  <select
                    value={newBatch.supplier_id}
                    onChange={e => setNewBatch({...newBatch, supplier_id: e.target.value})}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
              >
                Save Batch
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Tables */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Medicines Table ── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-800">Medicines Directory</h3>
                <span className="text-xs bg-slate-100 text-slate-600 py-1 px-2.5 rounded-full font-bold">
                  {medicines.length} items
                </span>
              </div>
              {medicines.length > 0 && (
                <button
                  onClick={() => setConfirmDelete({ type: 'all-medicines', label: 'All Medicines' })}
                  className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all"
                >
                  <Trash2 size={13} />
                  Delete All
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-5">ID</th>
                    <th className="py-3 px-5">Name / Generic</th>
                    <th className="py-3 px-5">Manufacturer</th>
                    <th className="py-3 px-5">HSN Code</th>
                    <th className="py-3 px-5 text-right">GST Rate</th>
                    <th className="py-3 px-5">Unit / Category</th>
                    <th className="py-3 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {medicines.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                        No medicines registered yet. Use the form to add one.
                      </td>
                    </tr>
                  ) : (
                    medicines.map(med => (
                      <tr key={med.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="py-3.5 px-5 font-mono text-xs">{med.id}</td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900">{med.name}</div>
                          {med.generic_name && <div className="text-xs text-slate-400 mt-0.5">{med.generic_name}</div>}
                        </td>
                        <td className="py-3.5 px-5">{med.manufacturer}</td>
                        <td className="py-3.5 px-5 font-mono text-xs">{med.hsn_code}</td>
                        <td className="py-3.5 px-5 text-right font-bold text-slate-800">{med.gst_rate}%</td>
                        <td className="py-3.5 px-5">
                          <span className="text-xs bg-blue-50 text-blue-600 py-0.5 px-2 rounded-full font-semibold">{med.category}</span>
                          <span className="text-xs text-slate-400 ml-1.5">/ {med.unit}</span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => setConfirmDelete({ type: 'medicine', id: med.id, label: med.name })}
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Batches Table ── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-800">Recorded Batches (Stock Levels)</h3>
                <span className="text-xs bg-indigo-50 text-indigo-600 py-1 px-2.5 rounded-full font-bold">
                  {batches.length} batches
                </span>
              </div>
              {batches.length > 0 && (
                <button
                  onClick={() => setConfirmDelete({ type: 'all-batches', label: 'All Batches' })}
                  className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all"
                >
                  <Trash2 size={13} />
                  Delete All
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-5">Batch No</th>
                    <th className="py-3 px-5">Medicine</th>
                    <th className="py-3 px-5 text-center">Expiry</th>
                    <th className="py-3 px-5 text-right">Quantity</th>
                    <th className="py-3 px-5 text-right">Cost (₹)</th>
                    <th className="py-3 px-5 text-right">MRP (₹)</th>
                    <th className="py-3 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                        No stock batches recorded yet.
                      </td>
                    </tr>
                  ) : (
                    batches.map(bat => {
                      const medicineName = medicines.find(m => m.id === bat.medicine_id)?.name || `Medicine ID: ${bat.medicine_id}`;
                      const isExpired = new Date(bat.expiry_date) < new Date();
                      return (
                        <tr key={bat.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-3.5 px-5 font-mono text-xs font-bold text-slate-900">{bat.batch_no}</td>
                          <td className="py-3.5 px-5 font-medium">{medicineName}</td>
                          <td className={`py-3.5 px-5 text-center font-bold text-xs ${isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {bat.expiry_date}
                            {isExpired && <span className="block text-[8px] uppercase tracking-wider text-rose-500 font-black">Expired</span>}
                          </td>
                          <td className="py-3.5 px-5 text-right font-bold text-slate-800">{bat.quantity}</td>
                          <td className="py-3.5 px-5 text-right font-mono">₹{parseFloat(bat.purchase_price).toFixed(2)}</td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">₹{parseFloat(bat.mrp).toFixed(2)}</td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              onClick={() => setConfirmDelete({ type: 'batch', id: bat.id, label: bat.batch_no })}
                              className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
