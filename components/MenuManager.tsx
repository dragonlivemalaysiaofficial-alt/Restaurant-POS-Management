
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem, Category, RestaurantSettings, View } from '../types';
import { AddIcon, EditIcon, TrashIcon, SaveIcon, CancelIcon, NavigationIcon, CategoryIcon, InventoryIcon, SearchIcon, GeminiIcon, UploadIcon, SparklesIcon } from './Icons';
import Modal from './Modal';
import { CATEGORIZED_STOCK_IMAGES } from '../constants';

interface MenuManagerProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  settings: RestaurantSettings;
}

type ManagerView = 'items' | 'categories' | 'inventory';

const MenuManager: React.FC<MenuManagerProps> = ({ menuItems, setMenuItems, categories, setCategories, settings }) => {
  const [activeView, setActiveView] = useState<ManagerView>('items');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImageGenModalOpen, setIsImageGenModalOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem> | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  const [imageGenPrompt, setImageGenPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [suggestionKeywords, setSuggestionKeywords] = useState('');
  const [generatedSuggestion, setGeneratedSuggestion] = useState<{name: string, description: string, imageUrl: string} | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [isGeneratingSuggestionImage, setIsGeneratingSuggestionImage] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const [galleryCategory, setGalleryCategory] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showConfirmation = (message: string, onConfirm: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setIsConfirmModalOpen(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleOpenItemModal = (item: Partial<MenuItem> | null = null) => {
    setCurrentItem(item || { name: '', price: 0, category: categories[0]?.name || '', imageUrl: '', stockTracking: false, stock: 0, commonNotes: [], description: '' });
    setIsItemModalOpen(true);
    setEditingItemId(item?.id || null);
  };
  
  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setCurrentItem(null);
    setEditingItemId(null);
  };

  const handleSaveItem = () => {
    if (!currentItem || !currentItem.name || !currentItem.category || !currentItem.price || currentItem.price <= 0) {
      alert("Please fill all fields with valid data.");
      return;
    }

    if (editingItemId) {
      setMenuItems(items => items.map(item => item.id === editingItemId ? { ...item, ...currentItem } as MenuItem : item));
    } else {
      const newItem: MenuItem = {
        id: `MENU-${Date.now()}`,
        name: currentItem.name,
        price: currentItem.price,
        category: currentItem.category,
        description: currentItem.description,
        imageUrl: currentItem.imageUrl,
        stockTracking: currentItem.stockTracking || false,
        stock: currentItem.stock || 0,
        commonNotes: currentItem.commonNotes || [],
      };
      setMenuItems(items => [...items, newItem]);
    }
    handleCloseItemModal();
  };

  const handleDeleteItem = (id: string) => {
    showConfirmation('Are you sure you want to delete this item?', () => {
      setMenuItems(items => items.filter(item => item.id !== id));
    });
  };
  
  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (e.target.type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setCurrentItem(prev => prev ? { ...prev, [name]: checked } : null);
    } else {
        setCurrentItem(prev => prev ? { ...prev, [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value } : null);
    }
  };

  const handleCommonNoteChange = (note: string, isChecked: boolean) => {
    setCurrentItem(prev => {
      if (!prev) return null;
      const currentNotes = prev.commonNotes || [];
      if (isChecked) {
        return { ...prev, commonNotes: [...currentNotes, note] };
      } else {
        return { ...prev, commonNotes: currentNotes.filter(n => n !== note) };
      }
    });
  };

  const handleImageSelect = (url: string) => {
    setCurrentItem(prev => prev ? { ...prev, imageUrl: url } : { imageUrl: url });
    setIsGalleryModalOpen(false);
    setIsImageGenModalOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("File is too large. Please upload an image under 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            handleImageSelect(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleGenerateImage = async () => {
    if (!imageGenPrompt.trim()) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, appetizing photo of ${imageGenPrompt}, suitable for a restaurant menu.`,
            config: { numberOfImages: 1, aspectRatio: '1:1' }
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        setGeneratedImageUrl(imageUrl);
    } catch (error) {
        console.error("Image generation failed:", error);
        alert("Failed to generate image. Please try again or check your prompt.");
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleOpenImageGenModal = () => {
    setImageGenPrompt(currentItem?.name || '');
    setGeneratedImageUrl(null);
    setIsImageGenModalOpen(true);
  };
  
  const handleGenerateDescription = async () => {
    if (!currentItem?.name || !currentItem?.category) {
      alert("Please enter an item name and select a category first.");
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a short, appetizing menu description (1-2 sentences) for a dish named "${currentItem.name}" in the "${currentItem.category}" category.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const generatedDescription = response.text.trim();
      setCurrentItem(prev => prev ? { ...prev, description: generatedDescription } : null);
    } catch (error) {
      console.error("Description generation failed:", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGenerateSuggestion = async () => {
    if (!suggestionKeywords.trim()) return;
    setIsGeneratingSuggestion(true);
    setIsGeneratingSuggestionImage(false);
    setGeneratedSuggestion(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Generate a creative menu item name, a short appetizing description (1-2 sentences), and a simple prompt for an image generation model (e.g., "photo of a spicy chicken sandwich") for a restaurant dish based on these keywords: "${suggestionKeywords}". The response should be a JSON object with three keys: "name", "description", and "imagePrompt".`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const parsed = JSON.parse(response.text);

        setIsGeneratingSuggestion(false);
        setIsGeneratingSuggestionImage(true);
        setGeneratedSuggestion({ name: parsed.name, description: parsed.description, imageUrl: '' });

        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, appetizing photo of ${parsed.imagePrompt}, suitable for a restaurant menu, clean background.`,
            config: { numberOfImages: 1, aspectRatio: '1:1' }
        });
        const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        
        setGeneratedSuggestion({ name: parsed.name, description: parsed.description, imageUrl: imageUrl });

    } catch (error) {
        console.error("Suggestion generation failed:", error);
        alert("Failed to generate suggestions. Please try again.");
        setIsGeneratingSuggestion(false);
    } finally {
        setIsGeneratingSuggestionImage(false);
    }
  };

  const handleUseSuggestion = () => {
    if (generatedSuggestion) {
      setCurrentItem(prev => prev ? { 
          ...prev, 
          name: generatedSuggestion.name, 
          description: generatedSuggestion.description,
          imageUrl: generatedSuggestion.imageUrl
      } : null);
      setIsSuggestionModalOpen(false);
    }
  };

  const handleOpenCategoryModal = (category: Category | null = null) => {
    setEditingCategory(category);
    setCurrentCategory(category || { name: '' });
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCurrentCategory(null);
    setEditingCategory(null);
  };

  const handleSaveCategory = () => {
    if (!currentCategory || !currentCategory.name?.trim()) {
        alert("Category name cannot be empty.");
        return;
    }
    const trimmedName = currentCategory.name.trim();

    if (editingCategory) {
        setCategories(cats => cats.map(c => c.id === editingCategory.id ? { ...c, name: trimmedName } : c));
        setMenuItems(items => items.map(item => item.category === editingCategory.name ? { ...item, category: trimmedName } : item));
    } else {
        if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
            alert("A category with this name already exists.");
            return;
        }
        const newCategory: Category = {
            id: `CAT-${Date.now()}`,
            name: trimmedName,
        };
        setCategories(cats => [...cats, newCategory]);
    }
    handleCloseCategoryModal();
  };
  
  const handleDeleteCategory = (category: Category) => {
    const isCategoryInUse = menuItems.some(item => item.category === category.name);
    if (isCategoryInUse) {
        alert(`Cannot delete category "${category.name}" as it is currently assigned to one or more menu items.`);
        return;
    }
    showConfirmation(`Are you sure you want to delete the category "${category.name}"?`, () => {
        setCategories(cats => cats.filter(c => c.id !== category.id));
    });
  };

  const handleStockChange = (itemId: string, newStock: string) => {
      const stockValue = parseInt(newStock, 10);
      setMenuItems(items => items.map(item => item.id === itemId ? { ...item, stock: isNaN(stockValue) ? 0 : stockValue } : item));
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItemsView = () => (
    <>
     <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-auto">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <button onClick={() => handleOpenItemModal()} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-colors w-full sm:w-auto justify-center">
          <AddIcon /> Add Item
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredMenuItems.map(item => (
          <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-md overflow-hidden flex flex-col group">
            <div className="relative">
              <img 
                src={item.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} 
                alt={item.name}
                className="w-full h-32 sm:h-40 object-cover bg-gray-200 dark:bg-gray-600 group-hover:scale-105 transition-transform duration-300"
              />
              {item.stockTracking && <span className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">Stock: {item.stock}</span>}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.category}</p>
              <p className="text-lg font-semibold text-primary mt-auto">{settings.currencySymbol}{item.price.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 flex justify-end gap-2">
              <button onClick={() => handleOpenItemModal(item)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><EditIcon /></button>
              <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><TrashIcon /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderCategoriesView = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Categories</h3>
        <button onClick={() => handleOpenCategoryModal()} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-colors">
          <AddIcon /> Add Category
        </button>
      </div>
       <div className="space-y-3">
        {categories.map(category => (
          <div key={category.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md flex justify-between items-center shadow-sm">
            <p className="font-semibold text-gray-800 dark:text-gray-100">{category.name}</p>
            <div className="flex gap-2">
              <button onClick={() => handleOpenCategoryModal(category)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><EditIcon /></button>
              <button onClick={() => handleDeleteCategory(category)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><TrashIcon /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderInventoryView = () => (
      <>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-6">Inventory Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                      <th scope="col" className="px-6 py-3">Item Name</th>
                      <th scope="col" className="px-6 py-3">Category</th>
                      <th scope="col" className="px-6 py-3">Stock Tracking</th>
                      <th scope="col" className="px-6 py-3">Current Stock</th>
                  </tr>
              </thead>
              <tbody>
                  {menuItems.map(item => (
                      <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.name}</th>
                          <td className="px-6 py-4">{item.category}</td>
                          <td className="px-6 py-4">
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" checked={item.stockTracking} onChange={() => setMenuItems(items => items.map(i => i.id === item.id ? {...i, stockTracking: !i.stockTracking} : i))} className="sr-only peer" />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                              </label>
                          </td>
                          <td className="px-6 py-4">
                              {item.stockTracking ? (
                                  <input 
                                      type="number" 
                                      value={item.stock} 
                                      onChange={(e) => handleStockChange(item.id, e.target.value)}
                                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                                  />
                              ) : (
                                  <span className="text-gray-400 dark:text-gray-500">Disabled</span>
                              )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Manage Menu</h2>
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
          <button
            onClick={() => setActiveView('items')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'items' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-600 dark:text-gray-300'}`}
          >
            <NavigationIcon view={View.MANAGE_MENU} /> Items
          </button>
          <button
            onClick={() => setActiveView('categories')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'categories' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-600 dark:text-gray-300'}`}
          >
            <CategoryIcon /> Categories
          </button>
           <button
            onClick={() => setActiveView('inventory')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'inventory' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-600 dark:text-gray-300'}`}
          >
            <InventoryIcon /> Inventory
          </button>
        </div>
      </div>
      
      {activeView === 'items' && renderItemsView()}
      {activeView === 'categories' && renderCategoriesView()}
      {activeView === 'inventory' && renderInventoryView()}

      {/* Item Modal */}
      <Modal isOpen={isItemModalOpen} onClose={handleCloseItemModal}>
        <h3 className="text-2xl font-bold mb-4">{editingItemId ? 'Edit' : 'Add'} Menu Item</h3>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <div className="mt-1 flex gap-2">
              <input type="text" name="name" value={currentItem?.name || ''} onChange={handleItemInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600" />
              <button onClick={() => setIsSuggestionModalOpen(true)} className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-md text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800" title="Suggest with AI">
                <SparklesIcon />
              </button>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <button 
                    onClick={handleGenerateDescription} 
                    disabled={isGeneratingDescription}
                    className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait font-semibold"
                >
                    <SparklesIcon />
                    {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                </button>
            </div>
            <textarea name="description" value={currentItem?.description || ''} onChange={handleItemInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select name="category" value={currentItem?.category || ''} onChange={handleItemInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600">
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
            <input type="number" name="price" value={currentItem?.price || ''} onChange={handleItemInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label>
            <div className="mt-1 flex rounded-md shadow-sm">
                <input type="text" name="imageUrl" value={currentItem?.imageUrl || ''} onChange={handleItemInputChange} placeholder="https://... or upload" className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600" />
                <button type="button" onClick={() => setIsGalleryModalOpen(true)} className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                  Choose
                </button>
                <button type="button" onClick={handleOpenImageGenModal} className="inline-flex items-center gap-2 px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                  <GeminiIcon /> AI
                </button>
            </div>
          </div>
           {settings.commonNotes && settings.commonNotes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Common Notes</label>
              <div className="mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md grid grid-cols-2 gap-2">
                {settings.commonNotes.map(note => (
                  <label key={note} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={currentItem?.commonNotes?.includes(note) || false}
                      onChange={(e) => handleCommonNoteChange(note, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {note}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
              <label htmlFor="stockTracking" className="text-sm font-medium text-gray-700 dark:text-gray-300">Track Stock?</label>
              <input id="stockTracking" name="stockTracking" type="checkbox" checked={currentItem?.stockTracking || false} onChange={handleItemInputChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          </div>
          {currentItem?.stockTracking && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity in Stock</label>
                <input type="number" name="stock" value={currentItem?.stock || ''} onChange={handleItemInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600" />
              </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleCloseItemModal} className="flex items-center gap-2 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><CancelIcon /> Cancel</button>
          <button onClick={handleSaveItem} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"><SaveIcon /> Save</button>
        </div>
      </Modal>

      {/* Category Modal */}
       <Modal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal}>
        <h3 className="text-2xl font-bold mb-4">{editingCategory ? 'Edit' : 'Add'} Category</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category Name</label>
            <input 
              type="text"
              name="name"
              value={currentCategory?.name || ''}
              onChange={(e) => setCurrentCategory(prev => prev ? { ...prev, name: e.target.value } : { name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleCloseCategoryModal} className="flex items-center gap-2 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><CancelIcon /> Cancel</button>
          <button onClick={handleSaveCategory} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"><SaveIcon /> Save</button>
        </div>
      </Modal>

      {/* Image Selection Modal */}
      <Modal isOpen={isGalleryModalOpen} onClose={() => setIsGalleryModalOpen(false)} maxWidth="max-w-4xl">
        <h3 className="text-2xl font-bold mb-4">Select an Image</h3>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <button onClick={() => setGalleryCategory('All')} className={`px-3 py-1 text-sm rounded-md ${galleryCategory === 'All' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>All</button>
                {Object.keys(CATEGORIZED_STOCK_IMAGES).map(cat => (
                    <button key={cat} onClick={() => setGalleryCategory(cat)} className={`px-3 py-1 text-sm rounded-md ${galleryCategory === cat ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{cat}</button>
                ))}
            </div>
            <div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <button onClick={handleUploadClick} className="flex items-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition-colors">
                    <UploadIcon /> Upload
                </button>
            </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-[60vh] overflow-y-auto">
            {(galleryCategory === 'All' ? Object.values(CATEGORIZED_STOCK_IMAGES).flat() : CATEGORIZED_STOCK_IMAGES[galleryCategory]).map(url => (
                <button key={url} onClick={() => handleImageSelect(url)} className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary focus:border-primary focus:outline-none">
                    <img src={url} alt="Stock" className="w-full h-full object-cover"/>
                </button>
            ))}
        </div>
      </Modal>

      {/* AI Image Generation Modal */}
      <Modal isOpen={isImageGenModalOpen} onClose={() => setIsImageGenModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><GeminiIcon /> Generate Image with AI</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Describe the food item you want to generate an image for. Be specific for best results!</p>
        <div className="flex gap-2">
            <input type="text" value={imageGenPrompt} onChange={e => setImageGenPrompt(e.target.value)} placeholder="e.g., 'Crispy golden french fries in a basket'" className="flex-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
            <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="bg-primary text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-colors disabled:bg-emerald-300">
                {isGeneratingImage ? 'Generating...' : 'Generate'}
            </button>
        </div>
        <div className="mt-4 h-64 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
            {isGeneratingImage && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>}
            {generatedImageUrl && (
                <div className="relative group">
                    <img src={generatedImageUrl} alt="Generated" className="h-64 w-auto object-contain"/>
                     <button onClick={() => handleImageSelect(generatedImageUrl)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Use this Image
                    </button>
                </div>
            )}
        </div>
      </Modal>

      {/* AI Suggestion Modal */}
      <Modal isOpen={isSuggestionModalOpen} onClose={() => setIsSuggestionModalOpen(false)} maxWidth="max-w-2xl">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><SparklesIcon /> AI Menu Suggestions</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Enter some keywords (e.g., 'spicy chicken sandwich') and let AI create a name, description, and image for you.</p>
        <div className="flex gap-2">
            <input type="text" value={suggestionKeywords} onChange={e => setSuggestionKeywords(e.target.value)} placeholder="Keywords..." className="flex-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
            <button onClick={handleGenerateSuggestion} disabled={isGeneratingSuggestion || isGeneratingSuggestionImage} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-700 transition-colors disabled:bg-purple-300">
                {isGeneratingSuggestion ? 'Thinking...' : isGeneratingSuggestionImage ? 'Drawing...' : 'Suggest'}
            </button>
        </div>
         <div className="mt-4 p-4 min-h-[200px] bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
            {(isGeneratingSuggestion) && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>}
            {generatedSuggestion && (
                <div className="flex gap-4 items-center w-full">
                    <div className="w-1/2">
                        <p className="font-bold text-lg">{generatedSuggestion.name}</p>
                        <p className="mt-1 text-sm">{generatedSuggestion.description}</p>
                    </div>
                    <div className="w-1/2 h-40 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                        {isGeneratingSuggestionImage && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>}
                        {generatedSuggestion.imageUrl && !isGeneratingSuggestionImage && (
                            <img src={generatedSuggestion.imageUrl} alt="Generated item" className="w-full h-full object-cover rounded-md" />
                        )}
                    </div>
                </div>
            )}
        </div>
        {generatedSuggestion && !isGeneratingSuggestion && !isGeneratingSuggestionImage && (
            <div className="mt-4 flex justify-end">
                <button onClick={handleUseSuggestion} className="bg-primary text-white font-bold py-2 px-4 rounded-lg">Use this Suggestion</button>
            </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Confirm Action</h3>
        <p className="my-4 text-gray-600 dark:text-gray-300">{confirmMessage}</p>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold">
            Cancel
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold">
            Confirm
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default MenuManager;
