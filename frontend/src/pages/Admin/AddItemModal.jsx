import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, UploadCloud, PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // --- 1. IMPORT useAuth ---

const AddItemModal = ({ isOpen, onClose, onSave, categories = [], itemToEdit }) => {
  const { token } = useAuth(); // --- 2. GET TOKEN ---

  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    category: '',
    price: '',
    image_url: '',
    ingredients: [], // --- 3. ADD INGREDIENTS ARRAY ---
  });
  const [uploading, setUploading] = useState(false);
  const isEditMode = Boolean(itemToEdit);

  const [selectedDropdownCategory, setSelectedDropdownCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const showNewCategoryInput = selectedDropdownCategory === 'ADD_NEW';

  // --- 4. NEW STATE FOR RECIPE BUILDER ---
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');

  // --- 5. FETCH ALL INGREDIENTS WHEN MODAL OPENS ---
  useEffect(() => {
    if (isOpen) {
      const fetchIngredients = async () => {
        try {
          const res = await fetch('http://localhost:3000/api/inventory', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to fetch ingredients');
          const data = await res.json();
          setAvailableIngredients(data);
        } catch (err) {
          toast.error(err.message);
        }
      };

      fetchIngredients();

      if (isEditMode) {
        // Fetch the item's details again to get its recipe
        const fetchItemDetails = async () => {
          try {
            const res = await fetch(`http://localhost:3000/api/items/${itemToEdit.item_id}`);
            if (!res.ok) throw new Error("Failed to fetch item's recipe");
            const data = await res.json();
            
            setFormData({
              item_name: data.item_name || '',
              description: data.description || '',
              category: data.category || '',
              price: data.price || '',
              image_url: data.image_url || '',
              ingredients: data.ingredients.map(ing => ({ // Format for our state
                  ingredient_id: ing.ingredient_id,
                  name: ing.name,
                  quantity_consumed: ing.quantity_consumed,
                  unit_of_measurement: ing.unit_of_measurement
              })) || []
            });
            setSelectedDropdownCategory(data.category || '');
          } catch (err) {
            toast.error(err.message);
            setFormData({ // Fallback
              item_name: itemToEdit.item_name || '',
              description: itemToEdit.description || '',
              category: itemToEdit.category || '',
              price: itemToEdit.price || '',
              image_url: itemToEdit.image_url || '',
              ingredients: []
            });
          }
        };
        fetchItemDetails();
        
      } else {
        // Reset form for "Add New"
        setFormData({ item_name: '', description: '', category: '', price: '', image_url: '', ingredients: [] });
        setSelectedDropdownCategory('');
        setNewCategoryName('');
      }
      // Reset recipe builder fields
      setSelectedIngredientId('');
      setIngredientQuantity('');
    }
  }, [itemToEdit, isOpen, token]);


  if (!isOpen) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleCategoryDropdownChange = (e) => {
    const value = e.target.value;
    setSelectedDropdownCategory(value);
    if (value !== 'ADD_NEW') {
      setFormData(prev => ({ ...prev, category: value }));
      setNewCategoryName('');
    } else {
      setFormData(prev => ({ ...prev, category: newCategoryName }));
    }
  };

  const handleNewCategoryNameChange = (e) => {
    const value = e.target.value;
    setNewCategoryName(value);
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      setUploading(true);
      try {
        const response = await fetch('http://localhost:3000/api/upload', {
          method: 'POST',
          // No auth token needed for this specific route if configured that way
          body: uploadFormData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Image upload failed');
        }
        setFormData(prevData => ({ ...prevData, image_url: data.image }));
        toast.success('Image uploaded successfully!');
      } catch (error) {
        toast.error(error.message);
      } finally {
        setUploading(false);
      }
  };

  // --- 6. NEW: HANDLERS FOR RECIPE BUILDER ---
  const handleAddIngredientToRecipe = () => {
    if (!selectedIngredientId || !ingredientQuantity || parseFloat(ingredientQuantity) <= 0) {
      toast.error('Please select an ingredient and enter a valid quantity.');
      return;
    }

    const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(selectedIngredientId));
    if (!ingredient) return;

    // Check if already in recipe
    const isAlreadyAdded = formData.ingredients.some(ing => ing.ingredient_id === ingredient.ingredient_id);
    if (isAlreadyAdded) {
      toast.error(`${ingredient.name} is already in the recipe.`);
      return;
    }

    // Add to recipe state
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredient_id: ingredient.ingredient_id,
          name: ingredient.name,
          quantity_consumed: parseFloat(ingredientQuantity),
          unit_of_measurement: ingredient.unit_of_measurement
        }
      ]
    }));

    // Reset fields
    setSelectedIngredientId('');
    setIngredientQuantity('');
  };

  const handleRemoveIngredientFromRecipe = (ingredientId) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing.ingredient_id !== ingredientId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category) {
        toast.error('Please select or add a category.');
        return;
    }
    // --- 7. NEW: VALIDATE RECIPE ---
    if (formData.ingredients.length === 0) {
        toast.error('A menu item must have at least one ingredient in its recipe.');
        return;
    }
    
    // Send the whole formData. The backend 'itemController'
    // now expects the 'ingredients' array.
    onSave(formData);
  };

  // --- STYLING (using inline styles to avoid Tailwind issues) ---
  const inputStyle = {
    marginTop: '4px',
    display: 'block',
    width: '100%',
    border: '1px solid #D1D5DB', // gray-300
    borderRadius: '0.375rem', // rounded-md
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    padding: '8px 12px',
  };
  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem', // text-sm
    fontWeight: '500', // font-medium
    color: '#374151', // gray-700
  };
  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#1D4ED8', // blue-600
    color: 'white',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer'
  };
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: '#E5E7EB', color: '#1F2937' }; // gray-200

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', 
      zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ 
        backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        padding: '32px', width: '100%', maxWidth: '42rem' // max-w-2xl to fit recipe
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          <button onClick={onClose} style={{ color: '#6B7280', border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        {/* We use a form with two columns */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '24px' }}>
          
          {/* Column 1: Item Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="item_name" style={labelStyle}>Item Name</label>
              <input type="text" id="item_name" value={formData.item_name} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label htmlFor="description" style={labelStyle}>Description</label>
              <textarea id="description" rows="3" value={formData.description} onChange={handleChange} style={inputStyle}></textarea>
            </div>
            <div>
              <label htmlFor="categoryDropdown" style={labelStyle}>Category</label>
              <select id="categoryDropdown" value={selectedDropdownCategory} onChange={handleCategoryDropdownChange} required={!showNewCategoryInput} style={inputStyle}>
                <option value="" disabled>Select a category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="ADD_NEW">-- Add New Category --</option>
              </select>
            </div>
            {showNewCategoryInput && (
              <div>
                <label htmlFor="newCategoryName" style={labelStyle}>New Category Name</label>
                <input type="text" id="newCategoryName" value={newCategoryName} onChange={handleNewCategoryNameChange} required style={inputStyle} placeholder="Enter new category name" />
              </div>
            )}
            <div>
              <label htmlFor="price" style={labelStyle}>Price</label>
              <input type="number" id="price" step="0.01" value={formData.price} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Image</label>
              {formData.image_url && (
                <img src={`http://localhost:3000${formData.image_url}`} alt="Preview" style={{ width: '100%', height: '128px', objectFit: 'cover', borderRadius: '0.375rem', margin: '8px 0' }} />
              )}
              <label htmlFor="image-upload" style={{
                marginTop: '4px', display: 'flex', justifyContent: 'center', padding: '20px',
                border: '2px dashed #D1D5DB', borderRadius: '0.375rem', cursor: 'pointer'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <UploadCloud style={{ margin: '0 auto', height: '48px', width: '48px', color: '#9CA3AF' }} />
                  <span style={{ fontSize: '0.875rem', color: '#4B5563' }}>{uploading ? 'Uploading...' : 'Upload a file'}</span>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>PNG, JPG, JPEG</p>
                </div>
              </label>
              <input id="image-upload" name="image-upload" type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>
          </div>

          {/* Column 2: Recipe Builder */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid #E5E7EB', paddingLeft: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Recipe</h3>
            
            {/* Recipe Add Form */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 3 }}>
                <label htmlFor="ingredient-select" style={labelStyle}>Ingredient</label>
                <select id="ingredient-select" value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)} style={inputStyle}>
                  <option value="" disabled>Select an ingredient</option>
                  {availableIngredients.map(ing => (
                    <option key={ing.ingredient_id} value={ing.ingredient_id}>{ing.name} ({ing.unit_of_measurement})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="ingredient-quantity" style={labelStyle}>Quantity</label>
                <input type="number" id="ingredient-quantity" step="0.01" value={ingredientQuantity} onChange={(e) => setIngredientQuantity(e.target.value)} style={inputStyle} placeholder="e.g., 150" />
              </div>
              <button type="button" onClick={handleAddIngredientToRecipe} style={{ ...buttonStyle, padding: '8px', backgroundColor: '#16A34A' }} title="Add to Recipe">
                <PlusCircle size={24} />
              </button>
            </div>

            {/* Recipe List */}
            <div style={{ marginTop: '16px', flex: 1, overflowY: 'auto' }}>
              <h4 style={{ fontWeight: '600' }}>Ingredients in this Recipe:</h4>
              {formData.ingredients.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '0.875rem', padding: '16px', textAlign: 'center' }}>No ingredients added yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '8px' }}>
                  {formData.ingredients.map(ing => (
                    <li key={ing.ingredient_id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px', borderBottom: '1px solid #F3F4F6'
                    }}>
                      <div>
                        <span style={{ fontWeight: '500' }}>{ing.name}</span>
                        <span style={{ color: '#4B5563', fontSize: '0.875rem', marginLeft: '8px' }}>
                          ({ing.quantity_consumed} {ing.unit_of_measurement})
                        </span>
                      </div>
                      <button type="button" onClick={() => handleRemoveIngredientFromRecipe(ing.ingredient_id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} title="Remove">
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </form>
        
        {/* Main Form Buttons */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
          <button type="button" onClick={onClose} style={cancelButtonStyle}>Cancel</button>
          <button type="submit" form="main-form" onClick={handleSubmit} style={{ ...buttonStyle, backgroundColor: '#1D4ED8' }} disabled={uploading}>
            {uploading ? 'Waiting for upload...' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;