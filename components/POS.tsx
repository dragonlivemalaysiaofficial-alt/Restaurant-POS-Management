import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MenuItem, CartItem, Order, Category, Discount, PaymentMethod, KitchenStatus, RestaurantSettings, User, Customer } from '../types';
import Modal from './Modal';
import BillPrint from './BillPrint';
import KOTPrint from './KOTPrint';
import BillPreview from './BillPreview';
import { PayIcon, ClearIcon, BackIcon, CartIcon, TrashIcon, AddIcon, CashIcon, CardIcon, BankIcon, TakeawayIcon, ResetIcon, SaveIcon, CancelIcon, NoteIcon, PreviewIcon, PrintIcon, CustomerIcon, EditIcon, SearchIcon, SplitIcon, InfoIcon, SendIcon } from './Icons';

interface POSProps {
  currentUser: User;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  settings: RestaurantSettings;
  takeawayOrderCounter: number;
  setTakeawayOrderCounter: React.Dispatch<React.SetStateAction<number>>;
  kotCounter: number;
  setKotCounter: React.Dispatch<React.SetStateAction<number>>;
  botCounter: number;
  setBotCounter: React.Dispatch<React.SetStateAction<number>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  addNotification: (message: string, type: 'success' | 'error') => void;
  playNotificationSound: () => void;
}

const generateCartId = () => `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const generateDiscountId = () => `discount-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const POS: React.FC<POSProps> = ({ currentUser, menuItems, setMenuItems, categories, orders, setOrders, settings, takeawayOrderCounter, setTakeawayOrderCounter, kotCounter, setKotCounter, botCounter, setBotCounter, customers, setCustomers, addNotification, playNotificationSound }) => {
  const [view, setView] = useState<'start' | 'tables' | 'takeaways' | 'order'>('start');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  
  const [orderToPrint, setOrderToPrint] = useState<{order: Order, options: any} | null>(null);
  const [orderToPrintKOT, setOrderToPrintKOT] = useState<Order | null>(null);
  const [orderToPrintBOT, setOrderToPrintBOT] = useState<Order | null>(null);

  const [orderToPreview, setOrderToPreview] = useState<Order | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [newDiscountDescription, setNewDiscountDescription] = useState('');

  const [isTakeawayModalOpen, setTakeawayModalOpen] = useState(false);
  const [newTakeawayNumberInput, setNewTakeawayNumberInput] = useState('');

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitState, setSplitState] = useState<{ originalItems: CartItem[], bills: CartItem[][] }>({ originalItems: [], bills: [[]] });

  const [isBillSelectionModalOpen, setIsBillSelectionModalOpen] = useState(false);
  const [billsToSelect, setBillsToSelect] = useState<Order[]>([]);
  const [infoTooltip, setInfoTooltip] = useState<{ id: string, text: string } | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  const [isPrintOptionsModalOpen, setIsPrintOptionsModalOpen] = useState(false);
  const [orderForPrintOptions, setOrderForPrintOptions] = useState<Order | null>(null);
  const [printOptions, setPrintOptions] = useState({
      copies: 1,
      billType: 'detailed' as 'detailed' | 'summary',
      showCustomer: true,
  });

  const prevOrdersRef = useRef<Order[] | null>(null);

  const activeDineInOrders = useMemo(() => {
    return orders.filter(o => o.orderType === 'dine-in' && (o.status === 'active' || o.status === 'billed'));
  }, [orders]);
  
  const activeTakeawayOrders = useMemo(() => {
    return orders.filter(o => o.orderType === 'takeaway' && (o.status === 'active' || o.status === 'billed'));
  }, [orders]);

  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);
  
  const tableStatuses = useMemo(() => {
    const statuses: { [key: string]: Order[] } = {};
    activeDineInOrders.forEach(o => {
        if (o.tableId) {
            if (!statuses[o.tableId]) {
                statuses[o.tableId] = [];
            }
            statuses[o.tableId].push(o);
        }
    });
    return statuses;
  }, [activeDineInOrders]);

  const cart = useMemo(() => activeOrder?.items || [], [activeOrder]);

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'All') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const { subtotal, tax, total, totalDiscountAmount } = useMemo(() => {
    const sub = cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
    
    let calculatedDiscount = 0;
    if (activeOrder && sub > 0) {
        activeOrder.discounts.forEach(discount => {
            if (discount.type === 'percentage') {
                calculatedDiscount += sub * (discount.value / 100);
            } else { // fixed
                calculatedDiscount += discount.value;
            }
        });
    }

    calculatedDiscount = Math.min(sub, calculatedDiscount);
    
    const totalAfterDiscount = sub - calculatedDiscount;
    const currentTaxRate = activeOrder?.taxRate ?? settings.taxRate;
    const taxAmount = totalAfterDiscount * (currentTaxRate / 100);
    const totalAmount = totalAfterDiscount + taxAmount;

    return { 
        subtotal: sub, 
        tax: taxAmount, 
        total: totalAmount, 
        totalDiscountAmount: calculatedDiscount 
    };
  }, [cart, activeOrder, settings.taxRate]);

  useEffect(() => {
    if (activeOrder) {
      const newOrderData = { ...activeOrder, subtotal, tax, total, totalDiscountAmount };
      if (
        activeOrder.subtotal !== newOrderData.subtotal ||
        activeOrder.tax !== newOrderData.tax ||
        activeOrder.total !== newOrderData.total ||
        activeOrder.totalDiscountAmount !== newOrderData.totalDiscountAmount
      ) {
        setOrders(currentOrders => currentOrders.map(o => o.id === newOrderData.id ? newOrderData : o));
      }
    }
  }, [subtotal, tax, total, totalDiscountAmount, activeOrder, setOrders]);
  
  useEffect(() => {
    if (!selectedOrderId) {
        setNewDiscountDescription('');
        setNewDiscountValue('');
        setNewDiscountType('percentage');
    }
  }, [selectedOrderId]);
  
  useEffect(() => {
    if (!isCustomerModalOpen) {
      setIsAddingNewCustomer(false);
      setCustomerSearch('');
      setNewCustomerName('');
      setNewCustomerPhone('');
    }
  }, [isCustomerModalOpen]);

  useEffect(() => {
    const prevOrders = prevOrdersRef.current;
    if (prevOrders) {
        const currentTakeawayOrders = orders.filter(o => o.orderType === 'takeaway' && o.status !== 'paid');
        
        currentTakeawayOrders.forEach(currentOrder => {
            const prevOrder = prevOrders.find(p => p.id === currentOrder.id);
            if (prevOrder && prevOrder.kitchenStatus !== 'Ready' && currentOrder.kitchenStatus === 'Ready') {
                addNotification(`Takeaway #${currentOrder.takeawayNumber} is ready for pickup!`, 'success');
                playNotificationSound();
            }
        });
    }
    prevOrdersRef.current = orders;
  }, [orders, addNotification, playNotificationSound]);
    
  useEffect(() => {
    if (orderToPrintKOT) {
        window.print();
        setTimeout(() => setOrderToPrintKOT(null), 500);
    }
  }, [orderToPrintKOT]);

  useEffect(() => {
      if (orderToPrintBOT) {
          window.print();
          setTimeout(() => setOrderToPrintBOT(null), 500);
      }
  }, [orderToPrintBOT]);

  const handleTableSelect = (tableId: string) => {
    const billsForTable = tableStatuses[tableId] || [];
    
    if (billsForTable.length === 0) {
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        orderType: 'dine-in',
        tableId: tableId,
        items: [],
        subtotal: 0, tax: 0, total: 0,
        taxRate: settings.taxRate,
        date: new Date(),
        status: 'active',
        kitchenStatus: 'Pending',
        discounts: [],
        createdBy: currentUser.name,
      };
      setOrders(orders => [...orders, newOrder]);
      setSelectedOrderId(newOrder.id);
      setView('order');
    } else if (billsForTable.length === 1) {
      setSelectedOrderId(billsForTable[0].id);
      setView('order');
    } else {
      setBillsToSelect(billsForTable);
      setIsBillSelectionModalOpen(true);
    }
  };

  const handleOpenTakeawayModal = () => {
    const suggestedNumber = takeawayOrderCounter + 1;
    setNewTakeawayNumberInput(suggestedNumber.toString());
    setTakeawayModalOpen(true);
  };

  const handleConfirmNewTakeaway = () => {
    const newNum = parseInt(newTakeawayNumberInput, 10);
    if (isNaN(newNum) || newNum <= 0) {
      alert("Please enter a valid, positive order number.");
      return;
    }

    if (activeTakeawayOrders.some(o => o.takeawayNumber === newNum)) {
      alert(`An active order with number #${newNum} already exists. Please choose a different number.`);
      return;
    }

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      orderType: 'takeaway',
      takeawayNumber: newNum,
      items: [],
      subtotal: 0, tax: 0, total: 0,
      taxRate: settings.taxRate,
      date: new Date(),
      status: 'active',
      kitchenStatus: 'Pending',
      discounts: [],
      createdBy: currentUser.name,
    };
    
    setOrders(currentOrders => [...currentOrders, newOrder]);
    setTakeawayOrderCounter(currentCounter => Math.max(currentCounter, newNum));
    setSelectedOrderId(newOrder.id);
    setView('order');
    setTakeawayModalOpen(false);
  };

  const handleResetCounter = () => {
    if (activeTakeawayOrders.length > 0) {
      alert("Cannot reset counter while there are active takeaway orders. Please complete or clear all active orders first.");
      return;
    }
    if (window.confirm("Are you sure you want to reset the takeaway order counter to 0? This cannot be undone.")) {
      setTakeawayOrderCounter(0);
      alert("Takeaway order counter has been reset.");
    }
  };


  const handleSelectTakeawayOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setView('order');
  }

  const handleSimpleAddItem = (menuItem: MenuItem) => {
    if (!activeOrder) return;
    
    if (menuItem.stockTracking && menuItem.stock <= 0) {
      alert(`${menuItem.name} is out of stock.`);
      return;
    }

    const existingItem = activeOrder.items.find(
      (item) => item.menuItem.id === menuItem.id && !item.note
    );

    if (existingItem) {
      handleQuantityChange(existingItem.cartItemId, (existingItem.quantity + 1).toString());
    } else {
      const newItem: CartItem = {
        cartItemId: generateCartId(),
        menuItem: menuItem,
        quantity: 1,
        note: undefined,
      };
      setOrders(orders => orders.map(o => o.id === activeOrder.id ? { ...o, items: [...o.items, newItem] } : o));
    }
  };
  
  const handleQuantityChange = (cartItemId: string, value: string) => {
    if (!activeOrder) return;
    const newQuantity = parseInt(value, 10);

    const itemToUpdate = activeOrder.items.find(item => item.cartItemId === cartItemId);
    if(itemToUpdate?.menuItem.stockTracking) {
        if(newQuantity > itemToUpdate.menuItem.stock) {
            alert(`Only ${itemToUpdate.menuItem.stock} of ${itemToUpdate.menuItem.name} left in stock.`);
            return;
        }
    }

    let updatedItems;
    if (isNaN(newQuantity) || newQuantity <= 0) {
      updatedItems = activeOrder.items.filter(item => item.cartItemId !== cartItemId);
    } else {
      updatedItems = activeOrder.items.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      );
    }
    setOrders(orders => orders.map(o => o.id === activeOrder.id ? { ...o, items: updatedItems } : o));
  };
  
  const handleNoteChange = (cartItemId: string, newNoteValue: string) => {
    if (!activeOrder) return;

    const newNote = newNoteValue.trim() ? newNoteValue.trim() : undefined;
    const sourceItem = activeOrder.items.find(i => i.cartItemId === cartItemId);
    if (!sourceItem) return;

    const targetItem = activeOrder.items.find(i =>
        i.cartItemId !== cartItemId &&
        i.menuItem.id === sourceItem.menuItem.id &&
        i.note === newNote
    );

    let updatedItems;
    if (targetItem) {
      updatedItems = activeOrder.items
        .map(item => 
          item.cartItemId === targetItem.cartItemId 
          ? { ...item, quantity: item.quantity + sourceItem.quantity } 
          : item
        )
        .filter(item => item.cartItemId !== cartItemId);
    } else {
      updatedItems = activeOrder.items.map(item =>
        item.cartItemId === cartItemId ? { ...item, note: newNote } : item
      );
    }

    setOrders(orders =>
      orders.map(o =>
        o.id === activeOrder.id ? { ...o, items: updatedItems } : o
      )
    );
  };

  const handleAddDiscount = () => {
    if (!activeOrder) return;
    const value = parseFloat(newDiscountValue);
    if (isNaN(value) || value <= 0) {
      alert("Please enter a valid discount value.");
      return;
    }
    if (!newDiscountDescription.trim()) {
        alert("Please enter a discount description.");
        return;
    }

    const newDiscount: Discount = {
        id: generateDiscountId(),
        description: newDiscountDescription.trim(),
        type: newDiscountType,
        value: value,
    };

    setOrders(orders => orders.map(o => o.id === activeOrder.id ? {
        ...o,
        discounts: [...o.discounts, newDiscount],
    } : o));

    setNewDiscountDescription('');
    setNewDiscountValue('');
  };

  const handleRemoveDiscount = (discountId: string) => {
      if (!activeOrder) return;
      setOrders(orders => orders.map(o => o.id === activeOrder.id ? {
          ...o,
          discounts: o.discounts.filter(d => d.id !== discountId)
      } : o));
  };

  const clearCart = () => {
    if (!activeOrder) return;
    setOrders(orders => orders.filter(o => o.id !== activeOrder.id));
    setSelectedOrderId(null);
    setView(activeOrder.orderType === 'dine-in' ? 'tables' : 'takeaways');
  };

  const handleSaveActiveOrder = () => {
    if (!activeOrder) return;
    
    const orderIdentifier = activeOrder.orderType === 'dine-in' 
        ? `Table ${activeOrder.tableId?.replace('T', '')}` 
        : `Takeaway #${activeOrder.takeawayNumber}`;
    addNotification(`Order for ${orderIdentifier} has been saved.`, 'success');

    setView(activeOrder.orderType === 'dine-in' ? 'tables' : 'takeaways');
    setSelectedOrderId(null);
  };
    
  const handleSaveAndPrintKots = () => {
    if (!activeOrder || activeOrder.items.length === 0) return;

    let nextKot = kotCounter;
    let nextBot = botCounter;

    const requiresKot = activeOrder.items.some(i => settings.kotBotCategoryAssignments.kitchen.includes(i.menuItem.category));
    const requiresBot = activeOrder.items.some(i => settings.kotBotCategoryAssignments.bar.includes(i.menuItem.category));
    
    let kotNumToSet: number | undefined = activeOrder.kot;
    let botNumToSet: number | undefined = activeOrder.bot;

    if (requiresKot) {
        nextKot++;
        setKotCounter(nextKot);
        kotNumToSet = nextKot;
    }
    if (requiresBot) {
        nextBot++;
        setBotCounter(nextBot);
        botNumToSet = nextBot;
    }

    if (!requiresKot && !requiresBot) {
        addNotification("No items to send to Kitchen or Bar.", "error");
        return;
    }
    
    const updatedOrder = {
        ...activeOrder,
        kot: kotNumToSet,
        bot: botNumToSet,
    };
    
    setOrders(orders => orders.map(o => o.id === activeOrder.id ? updatedOrder : o));

    if (requiresKot) setOrderToPrintKOT(updatedOrder);
    if (requiresBot) setOrderToPrintBOT(updatedOrder);

    const orderIdentifier = activeOrder.orderType === 'dine-in' 
        ? `Table ${activeOrder.tableId?.replace('T', '')}` 
        : `Takeaway #${activeOrder.takeawayNumber}`;
    addNotification(`Order for ${orderIdentifier} sent to kitchen/bar.`, 'success');

    setView(activeOrder.orderType === 'dine-in' ? 'tables' : 'takeaways');
    setSelectedOrderId(null);
  };

  const handlePresentBill = () => {
    if (!activeOrder) return;
    setOrders(currentOrders =>
        currentOrders.map(o =>
            o.id === activeOrder.id ? { ...o, status: 'billed' } : o
        )
    );
    setSelectedPaymentMethod(null);
    setPaymentModalOpen(true);
  };

  const handlePaymentAndPreview = () => {
    if (!activeOrder) return;
    if (!selectedPaymentMethod) {
      alert('Please select a payment method.');
      return;
    }

    // Finalize the order
    const paidOrder = { 
        ...activeOrder, 
        status: 'paid' as const, 
        date: new Date(),
        paymentMethod: selectedPaymentMethod,
    };
    
    setOrders(orders => orders.map(o => o.id === paidOrder.id ? paidOrder : o));
    
    // Deduct stock
    setMenuItems(currentMenuItems => {
        const newMenuItems = [...currentMenuItems];
        paidOrder.items.forEach(cartItem => {
            if (cartItem.menuItem.stockTracking) {
                const itemIndex = newMenuItems.findIndex(mi => mi.id === cartItem.menuItem.id);
                if (itemIndex !== -1) {
                    newMenuItems[itemIndex].stock -= cartItem.quantity;
                }
            }
        });
        return newMenuItems;
    });

    const orderIdentifier = paidOrder.orderType === 'dine-in' 
        ? `Table ${paidOrder.tableId?.replace('T', '')}` 
        : `Takeaway #${paidOrder.takeawayNumber}`;
    addNotification(`Order for ${orderIdentifier} saved successfully!`, 'success');

    // Set up for preview
    setOrderToPreview(paidOrder);
    setIsPreviewModalOpen(true);
    setPaymentModalOpen(false);
    
    // Reset the POS in the background
    setSelectedOrderId(null);
    setSelectedPaymentMethod(null);
    setView('start');
  };
  
  const handlePrintBill = () => {
    if (!activeOrder) return;
    setOrderForPrintOptions(activeOrder);
    setPrintOptions({ copies: 1, billType: 'detailed', showCustomer: true });
    setIsPrintOptionsModalOpen(true);
  };
    
  const handleExecutePrint = () => {
    if (!orderForPrintOptions) return;
    setOrderToPrint({ order: orderForPrintOptions, options: printOptions });
    
    setTimeout(() => {
        window.print();
        setOrderToPrint(null);
        setOrderForPrintOptions(null);
        setIsPrintOptionsModalOpen(false);
    }, 500);
  };

  const handleConfirmPrint = () => {
    if (!orderToPreview) return;
    setOrderForPrintOptions(orderToPreview);
    setPrintOptions({ copies: 1, billType: 'detailed', showCustomer: true });
    setIsPrintOptionsModalOpen(true);
    setIsPreviewModalOpen(false);
    setOrderToPreview(null);
  };

  const handleAssignCustomer = (customer: Customer) => {
    if (!activeOrder) return;
    setOrders(orders => orders.map(o => o.id === activeOrder.id ? { ...o, customer } : o));
    setIsCustomerModalOpen(false);
  };

  const handleRemoveCustomer = () => {
    if (!activeOrder) return;
    const { customer, ...orderWithoutCustomer } = activeOrder;
    setOrders(orders => orders.map(o => o.id === activeOrder.id ? orderWithoutCustomer : o));
  };
  
  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      alert("Please enter customer name and phone number.");
      return;
    }
    const newCustomer: Customer = {
      id: `CUST-${Date.now()}`,
      name: newCustomerName,
      phone: newCustomerPhone,
    };
    setCustomers(current => [...current, newCustomer]);
    handleAssignCustomer(newCustomer);
  };

    const openSplitModal = () => {
        if (!activeOrder) return;
        setSplitState({
            originalItems: JSON.parse(JSON.stringify(activeOrder.items)),
            bills: [[]],
        });
        setIsSplitModalOpen(true);
    };

    const handleConfirmSplit = () => {
        if (!activeOrder) return;
        if (splitState.originalItems.length > 0) {
            alert("Please assign all items to a bill before confirming.");
            return;
        }

        const newBills = splitState.bills.filter(bill => bill.length > 0);
        if (newBills.length < 2) {
            alert("You must create at least two bills to split the order.");
            return;
        }

        const newOrders: Order[] = newBills.map((billItems, index) => {
            const sub = billItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
            const taxAmount = sub * (settings.taxRate / 100);
            const totalAmount = sub + taxAmount;
            return {
                ...activeOrder,
                id: `ORD-${Date.now()}-${index}`,
                parentOrderId: activeOrder.id,
                items: billItems,
                subtotal: sub,
                tax: taxAmount,
                total: totalAmount,
                status: 'active',
                discounts: [], // Discounts are cleared on split
                totalDiscountAmount: 0,
                splitBillNumber: index + 1,
                totalSplitBills: newBills.length,
            };
        });

        setOrders(currentOrders => [
            ...currentOrders.map(o => o.id === activeOrder.id ? { ...o, status: 'split' as const } : o),
            ...newOrders
        ]);

        setIsSplitModalOpen(false);
        setView('tables');
        setSelectedOrderId(null);
    };

    const handleMoveItemToBill = (item: CartItem, toBillIndex: number) => {
        const itemInOrigin = splitState.originalItems.find(i => i.cartItemId === item.cartItemId);
        if (!itemInOrigin) return;

        const moveQuantity = (qty: number) => {
            // Remove from original
            const newOriginalItems = [...splitState.originalItems];
            const originalItemIndex = newOriginalItems.findIndex(i => i.cartItemId === item.cartItemId);
            if (newOriginalItems[originalItemIndex].quantity > qty) {
                newOriginalItems[originalItemIndex].quantity -= qty;
            } else {
                newOriginalItems.splice(originalItemIndex, 1);
            }

            // Add to new bill
            const newBills = [...splitState.bills];
            const existingItemInBill = newBills[toBillIndex].find(i => i.menuItem.id === item.menuItem.id && i.note === item.note);
            if (existingItemInBill) {
                existingItemInBill.quantity += qty;
            } else {
                newBills[toBillIndex].push({ ...item, quantity: qty, cartItemId: generateCartId() });
            }

            setSplitState({ originalItems: newOriginalItems, bills: newBills });
        };
        
        if (itemInOrigin.quantity > 1) {
            const qtyToMove = parseInt(prompt(`How many of "${item.menuItem.name}" to move? (Max: ${itemInOrigin.quantity})`, "1") || "0", 10);
            if (qtyToMove > 0 && qtyToMove <= itemInOrigin.quantity) {
                moveQuantity(qtyToMove);
            }
        } else {
            moveQuantity(1);
        }
    };
    
    const handleMoveItemBackToOriginal = (item: CartItem, fromBillIndex: number) => {
        const moveQuantity = (qty: number) => {
            // Remove from bill
            const newBills = [...splitState.bills];
            const billItemIndex = newBills[fromBillIndex].findIndex(i => i.cartItemId === item.cartItemId);
            if (newBills[fromBillIndex][billItemIndex].quantity > qty) {
                newBills[fromBillIndex][billItemIndex].quantity -= qty;
            } else {
                newBills[fromBillIndex].splice(billItemIndex, 1);
            }
            
            // Add back to original
            const newOriginalItems = [...splitState.originalItems];
            const existingItemInOriginal = newOriginalItems.find(i => i.menuItem.id === item.menuItem.id && i.note === item.note);
            if (existingItemInOriginal) {
                existingItemInOriginal.quantity += qty;
            } else {
                newOriginalItems.push({ ...item, quantity: qty, cartItemId: generateCartId() });
            }
            setSplitState({ originalItems: newOriginalItems, bills: newBills });
        };

        if (item.quantity > 1) {
            const qtyToMove = parseInt(prompt(`How many of "${item.menuItem.name}" to move back? (Max: ${item.quantity})`, "1") || "0", 10);
            if (qtyToMove > 0 && qtyToMove <= item.quantity) {
                moveQuantity(qtyToMove);
            }
        } else {
            moveQuantity(1);
        }
    };

    const handleCancelBill = () => {
        if (!activeOrder) return;
        setCancellationReason('');
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancelBill = () => {
        if (!activeOrder) return;
        if (!cancellationReason.trim()) {
            alert("Please provide a reason for cancellation.");
            return;
        }

        // Return stock for tracked items
        setMenuItems(currentMenuItems => {
            const newMenuItems = JSON.parse(JSON.stringify(currentMenuItems)); // Deep copy
            activeOrder.items.forEach(cartItem => {
                if (cartItem.menuItem.stockTracking) {
                    const itemIndex = newMenuItems.findIndex((mi: MenuItem) => mi.id === cartItem.menuItem.id);
                    if (itemIndex !== -1) {
                        newMenuItems[itemIndex].stock += cartItem.quantity;
                    }
                }
            });
            return newMenuItems;
        });

        // Update order status
        setOrders(currentOrders => currentOrders.map(o => o.id === activeOrder.id ? {
            ...o,
            status: 'cancelled',
            cancellationReason: cancellationReason.trim(),
            cancelledBy: currentUser.name,
            date: new Date(),
        } : o));
        
        const orderIdentifier = activeOrder.orderType === 'dine-in' 
            ? `Bill for Table ${activeOrder.tableId?.replace('T', '')}` 
            : `Bill for Takeaway #${activeOrder.takeawayNumber}`;
        addNotification(`${orderIdentifier} has been cancelled.`, 'error');

        setIsCancelModalOpen(false);
        setSelectedOrderId(null);
        setView(activeOrder.orderType === 'dine-in' ? 'tables' : 'takeaways');
    };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const renderStartView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-bold mb-8 text-gray-700 dark:text-gray-200">Select Order Type</h2>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
            <button
                onClick={() => setView('tables')}
                className="w-64 h-64 flex flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-all duration-200 transform hover:scale-105"
            >
                <span className="text-6xl leading-none" role="img" aria-label="POS">🍽️</span>
                <span className="text-2xl font-bold">Dine-In</span>
            </button>
            <button
                onClick={() => setView('takeaways')}
                className="w-64 h-64 flex flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:bg-secondary/10 hover:text-secondary dark:hover:bg-secondary/20 transition-all duration-200 transform hover:scale-105"
            >
                <TakeawayIcon />
                <span className="text-2xl font-bold">Takeaway</span>
            </button>
        </div>
    </div>
  );

  const renderTableSelection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('start')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Go back to order type selection"><BackIcon /></button>
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Select a Table</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {Array.from({ length: settings.numberOfTables }, (_, i) => i + 1).map(tableNum => {
          const tableId = `T${tableNum}`;
          const billsForTable = tableStatuses[tableId] || [];
          const status = billsForTable.length > 0 ? (billsForTable.some(b => b.status === 'billed') ? 'billed' : 'active') : 'available';

          const statusStyles = {
              available: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 hover:border-primary dark:hover:border-primary hover:text-primary',
              active: 'bg-secondary text-white shadow-lg',
              billed: 'bg-blue-500 text-white shadow-lg',
          };
          
          let statusText = 'Available';
          if (billsForTable.length === 1) {
            statusText = status === 'billed' ? 'Billed' : 'Occupied';
          } else if (billsForTable.length > 1) {
            statusText = `${billsForTable.length} Bills`;
          }

          return (
            <button
              key={tableId}
              onClick={() => handleTableSelect(tableId)}
              className={`p-4 rounded-lg transition-all duration-200 flex flex-col items-center justify-center aspect-square transform hover:scale-105 ${statusStyles[status]}`}
            >
              <span className="text-2xl font-bold">T{tableNum}</span>
              <span className="text-xs font-semibold mt-1">{statusText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTakeawayView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
       <div className="flex justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('start')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Go back to order type selection"><BackIcon /></button>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Takeaway Orders</h2>
        </div>
        <button 
            onClick={handleResetCounter}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-semibold py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Reset takeaway order counter"
          >
            <ResetIcon /> 
            <span className="hidden sm:inline">Reset Counter</span>
        </button>
      </div>
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <button
          onClick={handleOpenTakeawayModal}
          className="p-4 rounded-lg transition-all duration-200 flex flex-col items-center justify-center aspect-square transform hover:scale-105 bg-emerald-50 dark:bg-emerald-900/50 text-primary border-2 border-dashed border-primary"
        >
          <AddIcon />
          <span className="text-lg font-bold mt-2">New Order</span>
        </button>
        {activeTakeawayOrders.sort((a,b) => (a.takeawayNumber || 0) - (b.takeawayNumber || 0)).map(order => {
           const kitchenStatusStyles: { [key in KitchenStatus]: string } = {
                Pending: 'bg-gray-500 text-white shadow-lg',
                Preparing: 'bg-yellow-500 text-white shadow-lg',
                Ready: 'bg-green-500 text-white shadow-lg',
            };
           const cardStyle = order.status === 'billed' ? 'bg-blue-500 text-white shadow-lg' : (kitchenStatusStyles[order.kitchenStatus || 'Pending']);
           const isReady = order.kitchenStatus === 'Ready' && order.status !== 'billed';
           
           return (
            <button
              key={order.id}
              onClick={() => handleSelectTakeawayOrder(order.id)}
              className={`p-4 rounded-lg transition-all duration-200 flex flex-col justify-between aspect-square transform hover:scale-105 ${cardStyle} ${isReady ? 'animate-pulse-green' : ''}`}
            >
                <span className="text-sm">Takeaway</span>
                <span className="text-2xl font-bold">#{order.takeawayNumber}</span>
                <span className="text-xs font-semibold mt-1 flex-grow">{order.status === 'billed' ? 'Billed' : order.kitchenStatus}</span>
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderOrderView = () => {
    if (!activeOrder) return null;
    let orderTitle = '';
    if (activeOrder.orderType === 'dine-in') {
      orderTitle = `Table ${activeOrder.tableId?.replace('T','')}`;
      if (activeOrder.splitBillNumber) {
        orderTitle += ` (Bill ${activeOrder.splitBillNumber} of ${activeOrder.totalSplitBills})`;
      }
    } else {
      orderTitle = `Takeaway #${activeOrder.takeawayNumber}`;
    }

    return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 h-full flex flex-col">
        <div className="flex items-center gap-4 mb-4">
            <button onClick={() => { setView(activeOrder.orderType === 'dine-in' ? 'tables' : 'takeaways'); setSelectedOrderId(null); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Go back to selection"><BackIcon /></button>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Menu - {orderTitle}</h2>
        </div>
        <div className="mb-4 overflow-x-auto pb-2">
            <div className="flex space-x-2">
                <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${selectedCategory === 'All' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                    All
                </button>
                {categories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${selectedCategory === category.name ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2 -mr-2">
          {filteredMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSimpleAddItem(item)}
              disabled={item.stockTracking && item.stock <= 0}
              className="group relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-primary dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img src={item.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} alt={item.name} className="h-24 w-full object-cover bg-gray-200 dark:bg-gray-600 group-hover:scale-105 transition-transform" />
              <div className="p-2 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{settings.currencySymbol}{item.price.toFixed(2)}</p>
              </div>
              {item.stockTracking && item.stock <= 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold">Out of Stock</div>}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><CartIcon /> Cart</h3>
            <button onClick={clearCart} className="text-red-500 hover:text-red-700 font-semibold text-sm p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50" aria-label="Clear order">
                <ClearIcon />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Cart is empty</p>
            ) : (
                <div className="space-y-4">
                    {cart.map(item => (
                        <div key={item.cartItemId} className="flex items-start gap-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                           <img src={item.menuItem.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} alt={item.menuItem.name} className="w-16 h-16 object-cover rounded-md" />
                           <div className="flex-1">
                             <p className="font-bold text-gray-800 dark:text-gray-100">{item.menuItem.name}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.cartItemId, e.target.value)}
                                    className="w-16 p-1 text-center border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">x {settings.currencySymbol}{item.menuItem.price.toFixed(2)}</span>
                             </div>
                             <div className="flex items-center gap-2 mt-2">
                                <NoteIcon />
                                <input
                                    type="text"
                                    value={item.note || ''}
                                    onChange={(e) => handleNoteChange(item.cartItemId, e.target.value)}
                                    placeholder="Add note..."
                                    className="w-full text-xs p-1 border-b border-gray-300 focus:border-primary focus:outline-none bg-transparent dark:border-gray-500"
                                />
                             </div>
                           </div>
                           <p className="font-bold text-gray-800 dark:text-gray-100">{settings.currencySymbol}{(item.menuItem.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {cart.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span className="font-semibold">{settings.currencySymbol}{subtotal.toFixed(2)}</span></div>
                {activeOrder.discounts.map(d => (
                   <div key={d.id} className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                       <div className="flex items-center gap-1">
                         <button onClick={() => handleRemoveDiscount(d.id)} className="text-red-500 p-0.5 rounded-full hover:bg-red-100"><TrashIcon /></button>
                         <span>Discount ({d.description}):</span>
                       </div>
                       <span className="font-semibold">
                          -{d.type === 'percentage' ? `${d.value}%` : `${settings.currencySymbol}${d.value.toFixed(2)}`}
                       </span>
                   </div>
                ))}
                {totalDiscountAmount > 0 && 
                  <div className="flex justify-between font-bold text-orange-600 dark:text-orange-400">
                      <span>Total Discount:</span>
                      <span>-{settings.currencySymbol}{totalDiscountAmount.toFixed(2)}</span>
                  </div>
                }
                <div className="flex justify-between"><span>Tax ({settings.taxRate}%):</span><span className="font-semibold">{settings.currencySymbol}{tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-xl font-bold border-t border-gray-200 dark:border-gray-600 pt-2 mt-2"><span>Total:</span><span>{settings.currencySymbol}{total.toFixed(2)}</span></div>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                 <p className="text-xs font-semibold mb-2">Add Discount:</p>
                 <div className="flex flex-col gap-2">
                    <input type="text" value={newDiscountDescription} onChange={e => setNewDiscountDescription(e.target.value)} placeholder="Discount Reason (e.g., Staff)" className="p-1.5 text-sm w-full border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500" />
                    <div className="flex gap-2">
                        <input type="number" value={newDiscountValue} onChange={e => setNewDiscountValue(e.target.value)} placeholder="Value" className="p-1.5 text-sm w-full border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500" />
                        <select value={newDiscountType} onChange={e => setNewDiscountType(e.target.value as 'percentage' | 'fixed')} className="p-1.5 text-sm border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500">
                            <option value="percentage">%</option>
                            <option value="fixed">{settings.currencySymbol}</option>
                        </select>
                        <button onClick={handleAddDiscount} className="bg-secondary text-white font-bold p-1.5 rounded-md text-sm">Add</button>
                    </div>
                 </div>
              </div>

               <div className="flex items-center gap-2">
                  <button onClick={() => setIsCustomerModalOpen(true)} className="flex-1 flex justify-center items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold py-2 px-4 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors">
                      <CustomerIcon /> {activeOrder.customer ? 'Edit Customer' : 'Add Customer'}
                  </button>
                  {activeOrder.customer && <button onClick={handleRemoveCustomer} className="p-2 bg-red-100 dark:bg-red-900/50 text-red-500 rounded-lg hover:bg-red-200"><TrashIcon /></button>}
               </div>
               {activeOrder.customer && <p className="text-xs text-center text-gray-500">Assigned to: <strong>{activeOrder.customer.name}</strong> ({activeOrder.customer.phone})</p>}

               <div className="grid grid-cols-2 gap-2">
                <button onClick={handlePrintBill} className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"><PrintIcon /> Print Bill</button>
                {activeOrder.orderType === 'dine-in' && !activeOrder.parentOrderId &&
                    <button onClick={openSplitModal} className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"><SplitIcon /> Split Bill</button>
                }
               </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleSaveActiveOrder} className="flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"><SaveIcon /> Save Order</button>
                 <button onClick={handleSaveAndPrintKots} className="flex items-center justify-center gap-2 bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors">
                    <SendIcon /> Send to Kitchen
                </button>
              </div>
              <button onClick={handlePresentBill} className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors"><PayIcon /> Pay</button>

              {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
                <button onClick={handleCancelBill} className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors">
                    <CancelIcon /> Cancel Bill
                </button>
              )}
            </div>
        )}
      </div>
    </div>
  )};

  return (
    <div className="h-full">
      {view === 'start' && renderStartView()}
      {view === 'tables' && renderTableSelection()}
      {view === 'takeaways' && renderTakeawayView()}
      {view === 'order' && renderOrderView()}
      
      {orderToPrint && <BillPrint order={orderToPrint.order} settings={settings} options={orderToPrint.options} />}
      {orderToPrintKOT && <KOTPrint order={orderToPrintKOT} settings={settings} type="KOT" ticketNumber={orderToPrintKOT.kot!} />}
      {orderToPrintBOT && <KOTPrint order={orderToPrintBOT} settings={settings} type="BOT" ticketNumber={orderToPrintBOT.bot!} />}
      
      <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-4">Payment</h3>
        <div className="mb-6">
            <p className="text-lg text-gray-600 dark:text-gray-300">Total Amount Due:</p>
            <p className="text-4xl font-bold text-primary">{settings.currencySymbol}{activeOrder?.total.toFixed(2)}</p>
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-gray-700 dark:text-gray-200">Select Payment Method:</p>
          <div className="grid grid-cols-3 gap-4">
              {(['cash', 'card', 'bank'] as PaymentMethod[]).map(method => (
                  <button 
                      key={method} 
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${selectedPaymentMethod === method ? 'bg-primary/10 border-primary' : 'bg-gray-100 dark:bg-gray-700 border-transparent hover:border-primary'}`}
                  >
                      {method === 'cash' && <CashIcon />}
                      {method === 'card' && <CardIcon />}
                      {method === 'bank' && <BankIcon />}
                      <span className="font-semibold text-sm capitalize">{method}</span>
                  </button>
              ))}
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setPaymentModalOpen(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            <button onClick={handlePaymentAndPreview} disabled={!selectedPaymentMethod} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-emerald-300">
                Finalize & Preview Bill
            </button>
        </div>
      </Modal>

      <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-4 text-center">Payment Successful</h3>
        {orderToPreview && <BillPreview order={orderToPreview} settings={settings} />}
        <div className="mt-6 flex justify-center gap-3">
            <button onClick={handleConfirmPrint} className="w-full flex justify-center items-center gap-2 bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors"><PrintIcon /> Print Bill</button>
        </div>
        <div className="mt-2 text-center">
          <button onClick={() => setIsPreviewModalOpen(false)} className="text-sm text-gray-500 hover:underline">Close Preview</button>
        </div>
      </Modal>

      <Modal isOpen={isTakeawayModalOpen} onClose={() => setTakeawayModalOpen(false)}>
         <h3 className="text-2xl font-bold mb-4">New Takeaway Order</h3>
         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Number</label>
            <input 
                type="number" 
                value={newTakeawayNumberInput} 
                onChange={(e) => setNewTakeawayNumberInput(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
            />
         </div>
         <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setTakeawayModalOpen(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            <button onClick={handleConfirmNewTakeaway} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors">Create Order</button>
        </div>
      </Modal>

      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)}>
         <h3 className="text-2xl font-bold mb-4">Assign Customer</h3>
         {isAddingNewCustomer ? (
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input type="text" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                </div>
                 <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input type="tel" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddingNewCustomer(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Back to Search</button>
                    <button onClick={handleAddNewCustomer} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600">Save & Assign</button>
                </div>
            </div>
         ) : (
            <div>
              <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => handleAssignCustomer(c)} className="w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-sm text-gray-500">{c.phone}</p>
                    </button>
                ))}
              </div>
              <div className="mt-4 border-t pt-4">
                 <button onClick={() => setIsAddingNewCustomer(true)} className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold py-2 px-4 rounded-lg hover:bg-primary/20">
                    <AddIcon /> Add New Customer
                 </button>
              </div>
            </div>
         )}
      </Modal>

      <Modal isOpen={isSplitModalOpen} onClose={() => setIsSplitModalOpen(false)} maxWidth="max-w-4xl">
        <h3 className="text-2xl font-bold mb-4">Split Bill</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh]">
            <div className="border p-4 rounded-lg overflow-y-auto">
                <h4 className="font-bold mb-2">Original Items ({splitState.originalItems.reduce((t,i) => t + i.quantity, 0)})</h4>
                {splitState.originalItems.length > 0 ? (
                    <div className="space-y-2">
                    {splitState.originalItems.map(item => (
                        <div key={item.cartItemId} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <p className="font-semibold">{item.quantity}x {item.menuItem.name}</p>
                            {item.note && <p className="text-xs italic text-gray-500">Note: {item.note}</p>}
                            <div className="text-right mt-1">
                                {splitState.bills.map((_, billIndex) => (
                                    <button key={billIndex} onClick={() => handleMoveItemToBill(item, billIndex)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded-md ml-1 hover:bg-blue-600">
                                        &rarr; Bill {billIndex + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    </div>
                ) : <p className="text-gray-500 text-center">All items assigned.</p>}
            </div>
            <div className="overflow-y-auto">
                {splitState.bills.map((bill, billIndex) => (
                    <div key={billIndex} className="border p-4 rounded-lg mb-4">
                       <h4 className="font-bold mb-2">Bill {billIndex + 1}</h4>
                        <div className="space-y-2 min-h-[50px]">
                         {bill.map(item => (
                             <div key={item.cartItemId} className="p-2 bg-emerald-50 dark:bg-emerald-900/50 rounded-md flex justify-between items-center">
                                 <div>
                                    <p className="font-semibold">{item.quantity}x {item.menuItem.name}</p>
                                    {item.note && <p className="text-xs italic">Note: {item.note}</p>}
                                 </div>
                                 <button onClick={() => handleMoveItemBackToOriginal(item, billIndex)} className="text-xs bg-red-500 text-white px-2 py-1 rounded-md ml-1 hover:bg-red-600">
                                     &larr;
                                 </button>
                             </div>
                         ))}
                        </div>
                    </div>
                ))}
                 <button onClick={() => setSplitState(s => ({ ...s, bills: [...s.bills, []] }))} className="w-full mt-2 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300">
                    + Add Another Bill
                </button>
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setIsSplitModalOpen(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={handleConfirmSplit} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600">Confirm Split</button>
        </div>
      </Modal>

      <Modal isOpen={isBillSelectionModalOpen} onClose={() => setIsBillSelectionModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-4">Select Bill</h3>
        <div className="space-y-3">
          {billsToSelect.map(bill => (
            <button 
                key={bill.id}
                onClick={() => { setSelectedOrderId(bill.id); setView('order'); setIsBillSelectionModalOpen(false); }}
                className="w-full text-left p-3 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <p className="font-bold">Bill {bill.splitBillNumber} of {bill.totalSplitBills}</p>
              <p className="text-sm">{bill.items.length} items - {settings.currencySymbol}{bill.total.toFixed(2)}</p>
            </button>
          ))}
          <div className="mt-4 border-t pt-4">
             <button onClick={() => handleTableSelect(`T${billsToSelect[0].tableId?.replace('T','')}`)} className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold py-2 px-4 rounded-lg hover:bg-primary/20" disabled>
                <AddIcon /> New Bill (Feature coming soon)
             </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-4">Cancel Bill</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Please provide a reason for cancelling this bill. This action cannot be undone and item stock will be returned.</p>
        <div>
            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Cancellation</label>
            <textarea
            id="cancellationReason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600"
            />
        </div>
        <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setIsCancelModalOpen(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Back</button>
            <button onClick={handleConfirmCancelBill} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">Confirm Cancellation</button>
        </div>
      </Modal>

      <Modal isOpen={isPrintOptionsModalOpen} onClose={() => setIsPrintOptionsModalOpen(false)} maxWidth="max-w-4xl">
        <h3 className="text-2xl font-bold mb-4">Print Options</h3>
        <div className="grid md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Preview</h4>
                <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-md">
                    {orderForPrintOptions && <BillPreview order={{...orderForPrintOptions, customer: printOptions.showCustomer ? orderForPrintOptions.customer : undefined }} settings={settings} />}
                </div>
            </div>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Copies</label>
                    <input type="number" value={printOptions.copies} onChange={e => setPrintOptions(p => ({...p, copies: parseInt(e.target.value, 10) || 1}))} min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    <p className="text-xs text-gray-500 mt-1">Note: You may need to set the number of copies in your browser's print dialog.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bill Type</label>
                    <div className="mt-2 space-y-2">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="billType" value="detailed" checked={printOptions.billType === 'detailed'} onChange={e => setPrintOptions(p => ({...p, billType: e.target.value as any}))} />
                            <span>Detailed (with item list)</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="billType" value="summary" checked={printOptions.billType === 'summary'} onChange={e => setPrintOptions(p => ({...p, billType: e.target.value as any}))} />
                            <span>Summary (totals only)</span>
                        </label>
                    </div>
                </div>
                {orderForPrintOptions?.customer && (
                     <div>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={printOptions.showCustomer} onChange={e => setPrintOptions(p => ({...p, showCustomer: e.target.checked}))} />
                            <span>Show Customer Info</span>
                        </label>
                    </div>
                )}
                 <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                    <button onClick={() => setIsPrintOptionsModalOpen(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={handleExecutePrint} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"><PrintIcon/> Print</button>
                </div>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default POS;