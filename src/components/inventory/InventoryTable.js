import React, { useState, useEffect } from 'react';
import './InventoryTable.css';

const InventoryTable = ({ onTransactionAdd, onItemUpdate, aiActions, onAiAction }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showWasteDialog, setShowWasteDialog] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  // Watch for AI actions to refresh inventory
  useEffect(() => {
    if (aiActions && aiActions.length > 0) {
      const latestAction = aiActions[aiActions.length - 1];
      if (latestAction.type === 'refresh') {
        fetchInventory();
      }
    }
  }, [aiActions]);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (response.ok) {
        await fetchInventory();
        setShowAddForm(false);
        alert('Inventory item added successfully!');
      } else {
        alert('Failed to add inventory item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding inventory item');
    }
  };

  const handleUpdateItem = async (itemId, itemData) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (response.ok) {
        await fetchInventory();
        setEditingItem(null);
        alert('Inventory item updated successfully!');
      } else {
        alert('Failed to update inventory item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating inventory item');
    }
  };

  const handleTransaction = async (itemId, transactionData) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/inventory/${itemId}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });

      if (response.ok) {
        await fetchInventory();
        setShowTransactionForm(false);
        setSelectedItem(null);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
        
        alert('Transaction recorded successfully!');
      } else {
        alert('Failed to record transaction');
      }
    } catch (error) {
      console.error('Error recording transaction:', error);
      alert('Error recording transaction');
    }
  };

  const getStatusColor = (item) => {
    if (item.current_quantity <= item.min_quantity) return 'low-stock';
    if (item.current_quantity >= item.max_quantity) return 'overstock';
    
    // Check if item is expiring soon (within 5 days)
    if (item.expiration_date) {
      const expirationDate = new Date(item.expiration_date);
      const today = new Date();
      const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration <= 5 && daysUntilExpiration >= 0) {
        return 'expiring-soon';
      } else if (daysUntilExpiration < 0) {
        return 'expired';
      }
    }
    
    return 'normal';
  };

  const getStatusText = (item) => {
    if (item.current_quantity <= item.min_quantity) return 'Low Stock';
    if (item.current_quantity >= item.max_quantity) return 'Overstock';
    
    // Check if item is expiring soon (within 5 days)
    if (item.expiration_date) {
      const expirationDate = new Date(item.expiration_date);
      const today = new Date();
      const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration <= 5 && daysUntilExpiration >= 0) {
        return `Expiring in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`;
      } else if (daysUntilExpiration < 0) {
        return 'Expired';
      }
    }
    
    return 'Normal';
  };

  const handleAiWaste = (item) => {
    setSelectedItemForAction(item);
    setShowWasteDialog(true);
  };

  const handleAiDonation = (item) => {
    setSelectedItemForAction(item);
    setShowDonationDialog(true);
  };

  const handleWasteSubmit = async (quantity, notes) => {
    if (quantity && !isNaN(parseFloat(quantity))) {
      try {
        await onAiAction('record_transaction', {
          inventory_id: selectedItemForAction.id,
          transaction_type: 'waste',
          quantity: parseFloat(quantity),
          notes: notes || 'AI-suggested waste recording'
        });
        setShowWasteDialog(false);
        setSelectedItemForAction(null);
      } catch (error) {
        console.error('Error recording waste:', error);
      }
    }
  };

  const handleDonationSubmit = async (quantity, notes) => {
    if (quantity && !isNaN(parseFloat(quantity))) {
      try {
        await onAiAction('record_transaction', {
          inventory_id: selectedItemForAction.id,
          transaction_type: 'donation',
          quantity: parseFloat(quantity),
          notes: notes || 'AI-suggested donation'
        });
        setShowDonationDialog(false);
        setSelectedItemForAction(null);
      } catch (error) {
        console.error('Error recording donation:', error);
      }
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/inventory/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await fetchInventory();
      } else {
        console.error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading inventory...</div>;
  }

  return (
    <div className="inventory-table-container">
      <div className="inventory-header">
        <h3>Current Inventory</h3>
        <button 
          className="add-item-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Item
        </button>
      </div>

      {inventory.length === 0 ? (
        <div className="no-inventory">
          <p>No inventory items found. Add your first item to get started!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Current Qty</th>
                <th>Min/Max</th>
                <th>Cost per Unit</th>
                <th>Total Value</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className={getStatusColor(item)}>
                  <td className="item-name">
                    <div className="name-cell">
                      <strong>{item.name}</strong>
                      {item.storage_location && (
                        <span className="storage-location">📍 {item.storage_location}</span>
                      )}
                    </div>
                  </td>
                  <td className="category">
                    <span className="category-badge">{item.category || 'Uncategorized'}</span>
                  </td>
                  <td className="quantity">
                    <span className="current-qty">{item.current_quantity}</span>
                    <span className="unit">{item.unit}</span>
                  </td>
                  <td className="min-max">
                    <div className="min-max-cell">
                      <span className="min">Min: {item.min_quantity}</span>
                      <span className="max">Max: {item.max_quantity}</span>
                    </div>
                  </td>
                  <td className="cost-per-unit">
                    ${item.cost_per_unit?.toFixed(2) || '0.00'}
                  </td>
                  <td className="total-value">
                    ${((item.current_quantity || 0) * (item.cost_per_unit || 0)).toFixed(2)}
                  </td>
                  <td className="expiration">
                    {item.expiration_date ? 
                      new Date(item.expiration_date).toLocaleDateString() : 
                      'No date'
                    }
                  </td>
                  <td className="status">
                    <span className={`status-badge ${getStatusColor(item)}`}>
                      {getStatusText(item)}
                    </span>
                  </td>
                  
                    <div className="action-buttons">
                      <button 
                        className="transaction-btn"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowTransactionForm(true);
                        }}
                        title="Record transaction"
                      >
                        📝
                      </button>
                      <button 
                        className="edit-btn"
                        onClick={() => setEditingItem(item)}
                        title="Edit item"
                      >
                        ✏️
                      </button>
                      {onAiAction && (
                        <>
                          <button 
                            className="ai-waste-btn"
                            onClick={() => handleAiWaste(item)}
                            title="AI: Record waste"
                          >
                            🗑️
                          </button>
                          <button 
                            className="ai-donation-btn"
                            onClick={() => handleAiDonation(item)}
                            title="AI: Suggest donation"
                          >
                            🤝
                          </button>
                        </>
                      )}
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteItem(item)}
                        title="Delete item"
                      >
                        ❌
                      </button>
                    </div>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <AddItemForm 
          onAdd={handleAddItem}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {showTransactionForm && selectedItem && (
        <TransactionForm 
          item={selectedItem}
          onTransaction={handleTransaction}
          onClose={() => {
            setShowTransactionForm(false);
            setSelectedItem(null);
          }}
        />
      )}

      {editingItem && (
        <EditItemForm 
          item={editingItem}
          onUpdate={handleUpdateItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Waste Dialog */}
      {showWasteDialog && selectedItemForAction && (
        <WasteDialog
          item={selectedItemForAction}
          onSubmit={handleWasteSubmit}
          onClose={() => {
            setShowWasteDialog(false);
            setSelectedItemForAction(null);
          }}
        />
      )}

      {/* Donation Dialog */}
      {showDonationDialog && selectedItemForAction && (
        <DonationDialog
          item={selectedItemForAction}
          onSubmit={handleDonationSubmit}
          onClose={() => {
            setShowDonationDialog(false);
            setSelectedItemForAction(null);
          }}
        />
      )}
    </div>
  );
};

// Add Item Form Component
const AddItemForm = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    current_quantity: 0,
    min_quantity: 0,
    max_quantity: 0,
    cost_per_unit: 0,
    total_cost: 0,
    supplier: '',
    expiration_date: '',
    storage_location: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add Inventory Item</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Item name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Unit (lbs, cups, etc.)"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
            <input
              type="number"
              placeholder="Current quantity"
              value={formData.current_quantity}
              onChange={(e) => setFormData({...formData, current_quantity: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div className="form-row">
            <input
              type="number"
              placeholder="Min quantity"
              value={formData.min_quantity}
              onChange={(e) => setFormData({...formData, min_quantity: parseFloat(e.target.value) || 0})}
            />
            <input
              type="number"
              placeholder="Max quantity"
              value={formData.max_quantity}
              onChange={(e) => setFormData({...formData, max_quantity: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div className="form-row cost-row">
            <input
              type="number"
              step="0.01"
              placeholder="Cost per unit ($)"
              value={formData.cost_per_unit}
              onChange={(e) => setFormData({...formData, cost_per_unit: parseFloat(e.target.value) || 0})}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Total cost ($)"
              value={formData.total_cost}
              onChange={(e) => setFormData({...formData, total_cost: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
            />
            <input
              type="date"
              placeholder="Expiration date"
              value={formData.expiration_date}
              onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Storage location"
              value={formData.storage_location}
              onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
            />
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Add Item</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Transaction Form Component
const TransactionForm = ({ item, onTransaction, onClose }) => {
  const [formData, setFormData] = useState({
    type: 'usage',
    quantity: 0,
    cost: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }
    
    if (formData.type !== 'purchase' && formData.quantity > item.current_quantity) {
      alert(`Cannot ${formData.type} more than current quantity (${item.current_quantity} ${item.unit})`);
      return;
    }
    
    // Convert frontend form data to backend expected format
    const transactionData = {
      transaction_type: formData.type,
      quantity: formData.quantity,
      cost: formData.cost,
      notes: formData.notes,
      date: formData.date
    };
    onTransaction(item.id, transactionData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Record Transaction - {item.name}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Transaction Type:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              required
            >
              <option value="usage">Usage (Used in cooking/service)</option>
              <option value="waste">Waste (Expired/Damaged/Spoiled)</option>
              <option value="purchase">Purchase (New stock added)</option>
              <option value="donation">Donation (Donated to food bank)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Quantity ({item.unit}):</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={`Enter quantity in ${item.unit}`}
              value={formData.quantity || ''}
              onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Cost ($):</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter cost (optional)"
              value={formData.cost || ''}
              onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Notes (Optional):</label>
            <textarea
              placeholder="Add any additional notes about this transaction"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Record Transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Item Form Component
const EditItemForm = ({ item, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    unit: item.unit,
    current_quantity: item.current_quantity,
    min_quantity: item.min_quantity,
    max_quantity: item.max_quantity,
    cost_per_unit: item.cost_per_unit,
    total_cost: item.total_cost,
    supplier: item.supplier,
    expiration_date: item.expiration_date,
    storage_location: item.storage_location,
    notes: item.notes
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Item name is required');
      return;
    }
    
    if (formData.current_quantity < 0) {
      alert('Current quantity cannot be negative');
      return;
    }
    
    if (formData.min_quantity < 0 || formData.max_quantity < 0) {
      alert('Min and max quantities cannot be negative');
      return;
    }
    
    if (formData.min_quantity > formData.max_quantity) {
      alert('Min quantity cannot be greater than max quantity');
      return;
    }
    
    onUpdate(item.id, formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-modal">
        <div className="modal-header">
          <h3>Edit Item - {item.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Basic Information</h4>
            <div className="form-group">
              <label>Item Name *</label>
              <input
                type="text"
                placeholder="Enter item name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select category</option>
                <option value="Protein">Protein</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Dairy">Dairy</option>
                <option value="Grains">Grains</option>
                <option value="Spices">Spices</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
              >
                <option value="">Select unit</option>
                <option value="lbs">Pounds (lbs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="cups">Cups</option>
                <option value="pieces">Pieces</option>
                <option value="liters">Liters</option>
                <option value="gallons">Gallons</option>
                <option value="boxes">Boxes</option>
                <option value="bags">Bags</option>
                <option value="cans">Cans</option>
                <option value="bottles">Bottles</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h4>Quantity Management</h4>
            <div className="form-group">
              <label>Current Quantity ({formData.unit})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter current quantity"
                value={formData.current_quantity || ''}
                onChange={(e) => setFormData({...formData, current_quantity: parseFloat(e.target.value) || 0})}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Min Quantity ({formData.unit})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Minimum stock level"
                  value={formData.min_quantity || ''}
                  onChange={(e) => setFormData({...formData, min_quantity: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="form-group">
                <label>Max Quantity ({formData.unit})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Maximum stock level"
                  value={formData.max_quantity || ''}
                  onChange={(e) => setFormData({...formData, max_quantity: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Cost Information</h4>
            <div className="form-row cost-row">
              <div className="form-group">
                <label>Cost per Unit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter cost per unit"
                  value={formData.cost_per_unit || ''}
                  onChange={(e) => setFormData({...formData, cost_per_unit: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="form-group">
                <label>Total Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Total value"
                  value={formData.total_cost || ''}
                  onChange={(e) => setFormData({...formData, total_cost: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Additional Information</h4>
            <div className="form-group">
              <label>Supplier</label>
              <input
                type="text"
                placeholder="Enter supplier name"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Expiration Date</label>
              <input
                type="date"
                value={formData.expiration_date || ''}
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Storage Location</label>
              <select
                value={formData.storage_location || ''}
                onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
              >
                <option value="">Select storage location</option>
                <option value="Refrigerator">Refrigerator</option>
                <option value="Freezer">Freezer</option>
                <option value="Pantry">Pantry</option>
                <option value="Dry Storage">Dry Storage</option>
                <option value="Cooler">Cooler</option>
                <option value="Room Temperature">Room Temperature</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Notes</label>
              <textarea
                placeholder="Add any additional notes about this item"
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn">Update Item</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Waste Dialog Component
const WasteDialog = ({ item, onSubmit, onClose }) => {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity && !isNaN(parseFloat(quantity))) {
      onSubmit(parseFloat(quantity), notes);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Record Waste - {item.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Quantity Wasted ({item.unit})</label>
              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Enter amount in ${item.unit}`}
                required
              />
            </div>
            <div className="form-group">
              <label>Current Stock</label>
              <input
                type="text"
                value={`${item.current_quantity} ${item.unit}`}
                disabled
                className="disabled-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for waste (e.g., expired, damaged, spoiled)"
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn waste-btn">
              Record Waste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Donation Dialog Component
const DonationDialog = ({ item, onSubmit, onClose }) => {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity && !isNaN(parseFloat(quantity))) {
      onSubmit(parseFloat(quantity), notes);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Record Donation - {item.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Quantity to Donate ({item.unit})</label>
              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Enter amount in ${item.unit}`}
                required
              />
            </div>
            <div className="form-group">
              <label>Current Stock</label>
              <input
                type="text"
                value={`${item.current_quantity} ${item.unit}`}
                disabled
                className="disabled-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Donation Details (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recipient organization, reason for donation, etc."
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn donation-btn">
              Record Donation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryTable;
